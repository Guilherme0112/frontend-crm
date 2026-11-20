import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ActionButton from '@/src/components/common/Button';
import { SearchField } from '@/src/components/common/SearchField';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  MailWarning,
  UsersRound,
  Zap,
} from 'lucide-react';
import { useLeadsInfiniteQuery } from '@/src/features/leads/hooks';
import { LoadMoreButton } from '@/src/components/common/LoadMoreButton';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { useCrmsInfiniteQuery, useAllStepsQuery } from '@/src/features/crm/hooks';
import { useSendingTemplatesQuery } from '@/src/features/templates/hooks';
import { useEmailConfigsInfiniteQuery } from '@/src/features/email-configs/hooks';
import { useWhatsappSendersInfiniteQuery } from '@/src/features/whatsapp-senders/hooks';
import { useWhatsappTemplatesInfiniteQuery } from '@/src/features/whatsapp-templates/hooks';
import {
  useGroupQuery,
  useGroupLeadsQuery,
  useSyncGroupLeadsMutation,
  useSendGroupEmailsMutation,
  useSendGroupWhatsappMutation,
} from './hooks';
import { GroupSendSection } from './GroupSendSection';
import { WhatsappDispatchLogsSection } from './WhatsappDispatchLogsSection';
import { Modal } from '@/src/components/common/Modal';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage, getApiStatus } from '@/src/lib/formErrors';
import { getInitials } from '@/src/lib/format';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import { cn } from '@/src/lib/cn';
import Checkbox from '@mui/material/Checkbox';

type DispatchChannel = 'email' | 'whatsapp';

export function GroupPage() {
  const { id } = useParams();
  const groupId = Number(id);
  const { toast } = useToast();

  const groupQuery = useGroupQuery(groupId);
  const membersQuery = useGroupLeadsQuery(groupId);
  const templatesQuery = useSendingTemplatesQuery(1, 100);
  const crmsQuery = useCrmsInfiniteQuery();
  const syncMutation = useSyncGroupLeadsMutation();
  const sendEmailMutation = useSendGroupEmailsMutation();
  const sendWhatsappMutation = useSendGroupWhatsappMutation();

  const [search, setSearch] = useState('');
  const [crmFilter, setCrmFilter] = useState<number | 'all'>('all');
  const [stageFilter, setStageFilter] = useState<number | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendingBasicForbidden, setSendingBasicForbidden] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<DispatchChannel>('email');
  const [emailTemplateId, setEmailTemplateId] = useState<number | ''>('');
  const [emailConfigId, setEmailConfigId] = useState<number | ''>('');
  const [whatsappSenderId, setWhatsappSenderId] = useState<number | ''>('');
  const [whatsappTemplateId, setWhatsappTemplateId] = useState<number | ''>('');

  // Só busca a lista de configs quando o modal de disparo abre — não é exibida no dia a dia.
  const emailConfigsQuery = useEmailConfigsInfiniteQuery(25, sendModalOpen);
  const whatsappSendersQuery = useWhatsappSendersInfiniteQuery(50, sendModalOpen && dispatchChannel === 'whatsapp');
  const whatsappTemplatesQuery = useWhatsappTemplatesInfiniteQuery(50, sendModalOpen && dispatchChannel === 'whatsapp');
  // O combo de etapas carrega 10 e consulta o servidor conforme o usuário
  // digita — são até 500 no total, caras de trazer de uma vez.
  const [stepSearch, setStepSearch] = useState('');
  const stepsAllQuery = useAllStepsQuery(
    crmFilter === 'all' ? undefined : crmFilter,
    stepSearch || undefined,
  );

  const crms = useMemo(() => crmsQuery.items, [crmsQuery.items]);

  // O backend não filtra CRM por texto, então a busca do combo é local.
  // Começa com 10 e puxa as páginas seguintes só quando o usuário digita,
  // em vez de baixar o catálogo inteiro na abertura da tela.
  const loadMoreCrms = () => {
    if (crmsQuery.hasNextPage && ! crmsQuery.isFetchingNextPage) {
      void crmsQuery.fetchNextPage();
    }
  };

  const debouncedTerm = useDebouncedValue(search.trim());

  const leadsQuery = useLeadsInfiniteQuery(
    undefined,
    debouncedTerm || undefined,
    10,
    crmFilter === 'all' ? undefined : crmFilter,
    stageFilter === 'all' ? undefined : stageFilter,
  );
  const allLeads = leadsQuery.items;
  const leadsLoading = leadsQuery.isPending;
  const leadsError = leadsQuery.isError ? leadsQuery.error : null;

  const memberIds = useMemo(
    () => new Set((membersQuery.data ?? []).map((lead) => lead.id)),
    [membersQuery.data],
  );

  // Inicializa a seleção UMA vez na montagem do grupo. Refetches de membros
  // (ex.: "Salvar" invalida a query) não podem sobrescrever o que o usuário editou.
  const didInitSelectionRef = useRef(false);

  useEffect(() => {
    if (membersQuery.data && !didInitSelectionRef.current) {
      setSelectedIds(new Set(membersQuery.data.map((lead) => lead.id)));
      didInitSelectionRef.current = true;
    }
  }, [membersQuery.data]);

  useEffect(() => {
    didInitSelectionRef.current = false;
  }, [groupId]);

  const savedCount = memberIds.size;
  const isDirty =
    selectedIds.size !== memberIds.size ||
    [...selectedIds].some((id) => !memberIds.has(id));

  // Filtros de CRM/etapa já são aplicados no servidor — a lista já vem filtrada.
  const filteredLeads = allLeads;

  const allFilteredSelected =
    filteredLeads.length > 0 && filteredLeads.every((lead) => selectedIds.has(lead.id));
  const someFilteredSelected =
    filteredLeads.some((lead) => selectedIds.has(lead.id)) && !allFilteredSelected;

  const toggleLead = (leadId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const lead of filteredLeads) next.delete(lead.id);
      } else {
        for (const lead of filteredLeads) next.add(lead.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await syncMutation.mutateAsync({ id: groupId, leadIds: [...selectedIds] });
      toast.success('Seleção de leads salva');
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setSendingBasicForbidden(true);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível salvar a seleção', getApiErrorMessage(error));
    }
  };

  const handleSend = async () => {
    try {
      if (dispatchChannel === 'email') {
        if (!emailTemplateId || !emailConfigId) {
          toast.error('Seleção incompleta', 'Selecione um template e uma configuração de e-mail.');
          return;
        }
        const result = await sendEmailMutation.mutateAsync({
          groupId,
          templateId: Number(emailTemplateId),
          emailConfigId: Number(emailConfigId),
        });
        setSendModalOpen(false);
        toast.success(
          'Disparo de e-mail enfileirado',
          `${result.total} envio(s) processados em segundo plano. Acompanhe o histórico abaixo.`,
        );
        return;
      }

      if (!whatsappSenderId || !whatsappTemplateId) {
        toast.error('Seleção incompleta', 'Selecione um remetente e um template de WhatsApp.');
        return;
      }

      const result = await sendWhatsappMutation.mutateAsync({
        groupId,
        whatsappSenderId: Number(whatsappSenderId),
        whatsappTemplateId: Number(whatsappTemplateId),
      });
      setSendModalOpen(false);
      toast.success(
        'Disparo de WhatsApp enfileirado',
        `${result.queued} enfileirado(s), ${result.failed} falha(s) imediata(s) de ${result.total} lead(s). Acompanhe os logs abaixo.`,
      );
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setSendingBasicForbidden(true);
        setSendModalOpen(false);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível disparar', getApiErrorMessage(error));
    }
  };

  const templates = templatesQuery.data?.data ?? [];
  const emailConfigs = emailConfigsQuery.items ?? [];
  const savedCountForSend = memberIds.size;
  const selectedEmailTemplate = emailTemplateId
    ? templates.find((t) => t.id === Number(emailTemplateId))
    : undefined;
  const selectedEmailConfig = emailConfigId
    ? emailConfigs.find((c) => c.id === Number(emailConfigId))
    : undefined;
  const whatsappSenders = (whatsappSendersQuery.items ?? []).filter((s) => s.is_active);
  const whatsappTemplates = (whatsappTemplatesQuery.items ?? []).filter((t) => t.is_active);
  const selectedWhatsappSender = whatsappSenderId
    ? whatsappSenders.find((s) => s.id === Number(whatsappSenderId))
    : undefined;
  const selectedWhatsappTemplate = whatsappTemplateId
    ? whatsappTemplates.find((t) => t.id === Number(whatsappTemplateId))
    : undefined;
  const sendBlocked = savedCountForSend === 0 || isDirty;
  const isSending = sendEmailMutation.isPending || sendWhatsappMutation.isPending;
  const emailSendDisabled =
    savedCountForSend === 0 || isDirty || !emailTemplateId || !emailConfigId;
  const whatsappSendDisabled =
    savedCountForSend === 0 || isDirty || !whatsappSenderId || !whatsappTemplateId;

  if (groupQuery.isPending || membersQuery.isPending) {
    return (
      <div className="w-full space-y-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (groupQuery.isError || !groupQuery.data) {
    return (
      <div className="w-full space-y-4">
        <Link
          to="/disparos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Disparos</span>
        </Link>
        <ErrorState
          title="Grupo não encontrado"
          error={groupQuery.error}
          onRetry={() => void groupQuery.refetch()}
        />
      </div>
    );
  }

  if (membersQuery.isError) {
    return (
      <div className="w-full space-y-4">
        <Link
          to="/disparos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Disparos</span>
        </Link>
        <ErrorState
          title="Erro ao carregar os leads do grupo"
          error={membersQuery.error}
          onRetry={() => void membersQuery.refetch()}
        />
      </div>
    );
  }

  const group = groupQuery.data;
  const templateName = templates.find((t) => t.id === group.template_id)?.name;

  return (
    <div className="w-full space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Caminho" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
        <Link to="/disparos" className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
          Disparos
        </Link>
        <span aria-hidden="true">/</span>
        <span className="max-w-40 truncate text-zinc-600 dark:text-zinc-300">{group.name}</span>
      </nav>

      {/* Header do grupo */}
      <div className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/15">
              <UsersRound className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-zinc-400 dark:text-zinc-500">Grupo de disparo</p>
              <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {group.name}
              </h1>
              {group.description && (
                <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
                  {group.description}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                {templateName && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-2 py-0.5 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                    <Mail className="h-3 w-3" strokeWidth={1.8} />
                    {templateName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-2 py-0.5 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                  <UsersRound className="h-3 w-3" strokeWidth={1.8} />
                  {savedCount} {savedCount === 1 ? 'lead' : 'leads'}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setDispatchChannel(group.email_config_id ? 'email' : 'whatsapp');
              setEmailTemplateId(group.template_id ?? '');
              setEmailConfigId(group.email_config_id ?? '');
              setSendModalOpen(true);
            }}
            disabled={sendBlocked || isSending}
            title={
              isDirty
                ? 'Salve a seleção de leads antes de disparar'
                : savedCountForSend === 0
                  ? 'Marque ao menos um lead'
                  : 'Enfileirar disparo para o grupo'
            }
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Zap className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            )}
            <span>Disparar grupo</span>
          </Button>
        </div>
      </div>

      {sendingBasicForbidden && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Envio por email é exclusivo do plano Basic</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              Assine o Basic para disparar campanhas para este grupo.{' '}
              <Link to="/billing" className="font-semibold underline underline-offset-2">
                Ver planos
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Seleção de leads */}
      <section
        aria-labelledby="leads-section-title"
        className="rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="border-b border-zinc-950/[0.06] p-5 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="leads-section-title"
                className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
              >
                Leads do grupo
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Marque os leads que devem receber as campanhas deste grupo.
              </p>
            </div>
          </div>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nome ou e-mail..."
              ariaLabel="Buscar leads"
              className="flex-1"
            />
            <Autocomplete
              value={crmFilter === 'all' ? '' : String(crmFilter)}
              onChange={(value) => {
                setCrmFilter(value === '' ? 'all' : Number(value));
                setStageFilter('all');
              }}
              ariaLabel="Filtrar por CRM"
              emptyLabel="Todos os CRMs"
              options={crms.map((crm) => ({ value: String(crm.id), label: crm.name }))}
              onSearch={loadMoreCrms}
              loading={crmsQuery.isFetchingNextPage}
              className="min-w-44"
            />
            <Autocomplete
              value={stageFilter === 'all' ? '' : String(stageFilter)}
              onChange={(value) => setStageFilter(value === '' ? 'all' : Number(value))}
              ariaLabel="Filtrar por etapa"
              emptyLabel="Todas as etapas"
              options={(stepsAllQuery.data ?? []).map((step) => ({
                value: String(step.id),
                label: `${step.crm_name} · ${step.name}`,
              }))}
              placeholder="Etapa..."
              emptyMessage="Nenhuma etapa encontrada"
              onSearch={setStepSearch}
              loading={stepsAllQuery.isFetching}
              className="min-w-48"
            />
          </Stack>
        </div>

        {/* Lista */}
        <div className="max-h-[30rem] overflow-y-auto">
          {leadsLoading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : leadsError ? (
            <div className="p-5">
              <ErrorState
                title="Erro ao carregar leads"
                error={leadsError}
                onRetry={() => void leadsQuery.refetch()}
              />
            </div>
          ) : filteredLeads.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Nenhum lead encontrado para os filtros atuais.
            </p>
          ) : (
            <>
              <div className="border-b border-zinc-950/[0.06] bg-zinc-50/70 px-5 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={toggleAllFiltered}
                    size="small"
                    sx={{ p: 0, flexShrink: 0 }}
                  />
                  <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                    Selecionar todos
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    ({filteredLeads.length} {filteredLeads.length === 1 ? 'lead filtrado' : 'leads filtrados'})
                  </span>
                </label>
              </div>
              <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
              {filteredLeads.map((lead) => {
                const checked = selectedIds.has(lead.id);
                return (
                  <li key={lead.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]',
                        checked && 'bg-blue-50/50 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleLead(lead.id)}
                        size="small"
                        sx={{ p: 0, flexShrink: 0 }}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950/[0.05] text-[11px] font-bold text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">
                        {getInitials(lead.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                          {lead.name}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {lead.email}
                          {lead.phone ? ` · ${lead.phone}` : ''}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-right text-[10px] font-medium uppercase tracking-wide text-zinc-400 sm:block dark:text-zinc-500">
                        {[lead.crm_name, lead.step_name].filter(Boolean).join(' · ') || 'Sem etapa'}
                      </span>
                    </label>
                  </li>
                );
              })}
              </ul>
            </>
          )}

          {leadsQuery.hasNextPage && (
            <LoadMoreButton
              total={leadsQuery.total}
              loaded={allLeads.length}
              isFetchingNextPage={leadsQuery.isFetchingNextPage}
              hasNextPage={Boolean(leadsQuery.hasNextPage)}
              onLoadMore={() => void leadsQuery.fetchNextPage()}
              className="m-3 w-[calc(100%-1.5rem)]"
            />
          )}
        </div>

        {/* Footer com ação */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {selectedIds.size}
            </span>{' '}
            selecionado{selectedIds.size === 1 ? '' : 's'} de {leadsQuery.total ?? allLeads.length} no total
          </p>
          <Button variant="contained" color="primary" onClick={() => void handleSave()} disabled={!isDirty || syncMutation.isPending} className="shrink-0">
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            Salvar alterações
          </Button>
        </div>
      </section>

      {/* Histórico de disparos */}
      <GroupSendSection groupId={groupId} />
      <WhatsappDispatchLogsSection groupId={groupId} />

      {/* Modal de confirmação do disparo */}
      <Modal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        title="Disparar grupo"
        description="Escolha o canal e revise o resumo antes de enfileirar os envios."
        size="lg"
      >
        <div className="space-y-4">
          <div className="max-w-xs">
            <Autocomplete
              value={dispatchChannel}
              onChange={(value) => {
                if (value === 'email' || value === 'whatsapp') setDispatchChannel(value);
              }}
              ariaLabel="Canal de disparo"
              placeholder="Selecione o canal"
              options={[
                { value: 'email', label: 'E-mail' },
                { value: 'whatsapp', label: 'WhatsApp' },
              ]}
              clearable={false}
              debounceMs={300}
              className="w-full"
            />
          </div>

          {dispatchChannel === 'email' ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Template de e-mail</span>
                  <Autocomplete
                    value={emailTemplateId === '' ? '' : String(emailTemplateId)}
                    onChange={(value) => setEmailTemplateId(value ? Number(value) : '')}
                    ariaLabel="Template de e-mail"
                    placeholder="Selecione um template"
                    emptyMessage="Nenhum template encontrado"
                    options={templates.map((t) => ({
                      value: String(t.id),
                      label: t.name,
                      description: t.description || undefined,
                    }))}
                    loading={templatesQuery.isFetching}
                    debounceMs={300}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Configuração de e-mail (SMTP)</span>
                  <Autocomplete
                    value={emailConfigId === '' ? '' : String(emailConfigId)}
                    onChange={(value) => setEmailConfigId(value ? Number(value) : '')}
                    ariaLabel="Configuração de e-mail (SMTP)"
                    placeholder="Selecione uma configuração"
                    emptyMessage="Nenhuma configuração encontrada"
                    options={emailConfigs.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                      description: `${c.from_name} <${c.from_address}>`,
                    }))}
                    loading={emailConfigsQuery.isFetching}
                    debounceMs={300}
                    className="w-full"
                  />
                </div>
              </div>

              {(templatesQuery.isFetching || emailConfigsQuery.isFetching) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Carregando templates e configurações de e-mail...</p>
              )}
              {!templatesQuery.isFetching && templates.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Nenhum template de e-mail encontrado.{' '}
                  <Link
                    to="/sending-templates"
                    onClick={() => setSendModalOpen(false)}
                    className="font-semibold underline underline-offset-2"
                  >
                    Configurar templates
                  </Link>
                </p>
              )}
              {!emailConfigsQuery.isFetching && emailConfigs.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Nenhuma configuração de e-mail encontrada.{' '}
                  <Link
                    to="/email-configs"
                    onClick={() => setSendModalOpen(false)}
                    className="font-semibold underline underline-offset-2"
                  >
                    Configurar e-mail (SMTP)
                  </Link>
                </p>
              )}

              <dl className="divide-y divide-zinc-950/[0.06] rounded-xl border border-zinc-950/[0.08] dark:divide-white/[0.06] dark:border-white/[0.08]">
                {[
                  ['Canal', 'E-mail'],
                  ['Template', selectedEmailTemplate?.name ?? '—'],
                  [
                    'Remetente',
                    selectedEmailConfig
                      ? `${selectedEmailConfig.from_name} <${selectedEmailConfig.from_address}>`
                      : '—',
                  ],
                  ['Assunto', selectedEmailTemplate?.name ?? '—'],
                  [
                    'Destinatários',
                    `${savedCountForSend} ${savedCountForSend === 1 ? 'lead selecionado' : 'leads selecionados'}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
                    <dd className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <Link
                  to="/sending-templates"
                  onClick={() => setSendModalOpen(false)}
                  className="font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  Gerenciar templates de e-mail
                </Link>
                <Link
                  to="/email-configs"
                  onClick={() => setSendModalOpen(false)}
                  className="font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  Gerenciar configurações de e-mail
                </Link>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Cada destinatário recebe o template com as variáveis do lead. O envio acontece em segundo plano; acompanhe no histórico de e-mail abaixo.
              </p>
            </>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Remetente WhatsApp</span>
                  <Autocomplete
                    value={whatsappSenderId === '' ? '' : String(whatsappSenderId)}
                    onChange={(value) => setWhatsappSenderId(value ? Number(value) : '')}
                    ariaLabel="Remetente WhatsApp"
                    placeholder="Selecione um remetente ativo"
                    emptyMessage="Nenhum remetente ativo encontrado"
                    options={whatsappSenders.map((s) => ({
                      value: String(s.id),
                      label: `${s.name}${s.phone_number ? ` (${s.phone_number})` : ''}`,
                      description: s.phone_number_id ? `ID: ${s.phone_number_id}` : undefined,
                    }))}
                    loading={whatsappSendersQuery.isFetching}
                    debounceMs={300}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Template WhatsApp</span>
                  <Autocomplete
                    value={whatsappTemplateId === '' ? '' : String(whatsappTemplateId)}
                    onChange={(value) => setWhatsappTemplateId(value ? Number(value) : '')}
                    ariaLabel="Template WhatsApp"
                    placeholder="Selecione um template ativo"
                    emptyMessage="Nenhum template ativo encontrado"
                    options={whatsappTemplates.map((t) => ({
                      value: String(t.id),
                      label: `${t.name} (${t.language})`,
                      description: t.category || undefined,
                    }))}
                    loading={whatsappTemplatesQuery.isFetching}
                    debounceMs={300}
                    className="w-full"
                  />
                </div>
              </div>
              {(whatsappSendersQuery.isFetching || whatsappTemplatesQuery.isFetching) && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Carregando remetentes e templates do WhatsApp...</p>
              )}
              {!whatsappSendersQuery.isFetching && whatsappSenders.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Nenhum remetente WhatsApp ativo encontrado.{' '}
                  <Link
                    to="/whatsapp-senders"
                    onClick={() => setSendModalOpen(false)}
                    className="font-semibold underline underline-offset-2"
                  >
                    Configurar remetentes
                  </Link>
                </p>
              )}
              {!whatsappTemplatesQuery.isFetching && whatsappTemplates.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Nenhum template WhatsApp ativo encontrado.{' '}
                  <Link
                    to="/whatsapp-templates"
                    onClick={() => setSendModalOpen(false)}
                    className="font-semibold underline underline-offset-2"
                  >
                    Configurar templates
                  </Link>
                </p>
              )}
              <dl className="divide-y divide-zinc-950/[0.06] rounded-xl border border-zinc-950/[0.08] dark:divide-white/[0.06] dark:border-white/[0.08]">
                {[
                  ['Canal', 'WhatsApp'],
                  ['Remetente', selectedWhatsappSender ? `${selectedWhatsappSender.name}${selectedWhatsappSender.phone_number ? ` (${selectedWhatsappSender.phone_number})` : ''}` : '—'],
                  ['Template', selectedWhatsappTemplate ? `${selectedWhatsappTemplate.name} (${selectedWhatsappTemplate.language})` : '—'],
                  ['Destinatários', `${savedCountForSend} ${savedCountForSend === 1 ? 'lead selecionado' : 'leads selecionados'}`],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
                    <dd className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <Link
                  to="/whatsapp-senders"
                  onClick={() => setSendModalOpen(false)}
                  className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  Gerenciar remetentes WhatsApp
                </Link>
                <Link
                  to="/whatsapp-templates"
                  onClick={() => setSendModalOpen(false)}
                  className="font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  Gerenciar templates WhatsApp
                </Link>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                O envio é enfileirado e processado em segundo plano (com tentativas em falhas temporárias). Leads sem telefone válido geram falha imediata no log. Acompanhe em "Logs de disparo WhatsApp" abaixo.
              </p>
            </>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="outlined" color="inherit" onClick={() => setSendModalOpen(false)}>
              Cancelar
            </Button>
            <ActionButton
              onClick={() => void handleSend()}
              disabled={isSending || (dispatchChannel === 'email' ? emailSendDisabled : whatsappSendDisabled)}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Zap className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              )}
              Confirmar disparo
            </ActionButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
