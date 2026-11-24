import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import { ArrowLeft, History, Loader2, Mail, Trash2, UserPlus, UsersRound, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Modal } from '@/src/components/common/Modal';
import { Pagination } from '@/src/components/common/Pagination';
import { SearchField } from '@/src/components/common/SearchField';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
import { useToast } from '@/src/components/common/Toast';
import { useAllStepsQuery, useCrmsInfiniteQuery } from '@/src/features/crm/hooks';
import { useLeadsPaginatedQuery } from '@/src/features/leads/hooks';
import { useDebouncedValue } from '@/src/lib/useDebouncedValue';
import { maskPhone } from '@/src/lib/format';
import {
  useGroupLeadIdsQuery,
  useGroupLeadsPaginatedQuery,
  useGroupQuery,
  useSendGroupEmailsMutation,
  useSendGroupWhatsappMutation,
  useSyncGroupLeadsMutation,
} from './hooks';
import { useSendingTemplatesQuery } from '@/src/features/templates/hooks';
import { useEmailConfigsQuery } from '@/src/features/email-configs/hooks';
import { useWhatsappSendersQuery } from '@/src/features/whatsapp-senders/hooks';
import { useWhatsappTemplatesQuery } from '@/src/features/whatsapp-templates/hooks';
import { useWhatsappUnofficialInstancesQuery } from '@/src/features/whatsapp-unofficial-instances/hooks';
import { useWhatsappUnofficialTemplatesQuery } from '@/src/features/whatsapp-unofficial-templates/hooks';

type DispatchChannel = 'email' | 'whatsapp';
type WhatsappProvider = 'official' | 'unofficial';

export function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const groupQuery = useGroupQuery(groupId);
  const memberIdsQuery = useGroupLeadIdsQuery(groupId);
  const syncMutation = useSyncGroupLeadsMutation();
  const sendEmailMutation = useSendGroupEmailsMutation();
  const sendWhatsappMutation = useSendGroupWhatsappMutation();

  const [memberSearch, setMemberSearch] = useState('');
  const debouncedMemberSearch = useDebouncedValue(memberSearch.trim());
  const [memberPage, setMemberPage] = useState(1);
  const [removeTarget, setRemoveTarget] = useState<{ id: number; name: string } | null>(null);
  const MEMBERS_PER_PAGE = 10;
  const membersQuery = useGroupLeadsPaginatedQuery(groupId, memberPage, MEMBERS_PER_PAGE, debouncedMemberSearch);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [addCrmFilter, setAddCrmFilter] = useState<number | 'all'>('all');
  const [addStageFilter, setAddStageFilter] = useState<number | 'all'>('all');
  const [addStepSearch, setAddStepSearch] = useState('');
  const [addCrmOpen, setAddCrmOpen] = useState(false);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [addSelectedIds, setAddSelectedIds] = useState<Set<number>>(new Set());
  const [addPage, setAddPage] = useState(1);
  const debouncedAddSearch = useDebouncedValue(addSearch.trim());
  const debouncedAddStepSearch = useDebouncedValue(addStepSearch.trim());

  useEffect(() => { setAddPage(1); }, [addCrmFilter, addStageFilter, debouncedAddSearch]);
  useEffect(() => { setMemberPage(1); }, [debouncedMemberSearch]);

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sendingBasicForbidden, setSendingBasicForbidden] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState<DispatchChannel>('email');
  const [whatsappProvider, setWhatsappProvider] = useState<WhatsappProvider>('unofficial');
  const [emailTemplateId, setEmailTemplateId] = useState<number | ''>('');
  const [emailConfigId, setEmailConfigId] = useState<number | ''>('');
  const [whatsappSenderId, setWhatsappSenderId] = useState<number | ''>('');
  const [whatsappTemplateId, setWhatsappTemplateId] = useState<number | ''>('');
  const [unofficialInstanceId, setUnofficialInstanceId] = useState<number | ''>('');
  const [unofficialTemplateId, setUnofficialTemplateId] = useState<number | ''>('');

  const addCrmsQuery = useCrmsInfiniteQuery(addCrmOpen);
  const addStepsQuery = useAllStepsQuery(
    addCrmFilter === 'all' ? undefined : addCrmFilter,
    debouncedAddStepSearch || undefined,
    10,
    addStepOpen,
  );
  const addLeadsEnabled = addCrmFilter !== 'all' || addStageFilter !== 'all';
  const addLeadsQuery = useLeadsPaginatedQuery(
    addStageFilter === 'all' ? undefined : addStageFilter,
    debouncedAddSearch || undefined,
    15,
    addCrmFilter === 'all' ? undefined : addCrmFilter,
    addLeadsEnabled,
    addPage,
  );

  const templatesQuery = useSendingTemplatesQuery(1, 100, '', sendModalOpen && dispatchChannel === 'email');
  const emailConfigsQuery = useEmailConfigsQuery(1, 100, sendModalOpen && dispatchChannel === 'email');
  const whatsappSendersQuery = useWhatsappSendersQuery(1, 100, sendModalOpen && dispatchChannel === 'whatsapp' && whatsappProvider === 'official');
  const whatsappTemplatesQuery = useWhatsappTemplatesQuery(1, 100, sendModalOpen && dispatchChannel === 'whatsapp' && whatsappProvider === 'official');
  const unofficialInstancesQuery = useWhatsappUnofficialInstancesQuery(sendModalOpen && dispatchChannel === 'whatsapp' && whatsappProvider === 'unofficial');
  const unofficialTemplatesQuery = useWhatsappUnofficialTemplatesQuery(sendModalOpen && dispatchChannel === 'whatsapp' && whatsappProvider === 'unofficial');

  const group = groupQuery.data;
  const members = membersQuery.data?.data ?? [];
  const memberIds = useMemo(() => new Set(memberIdsQuery.data ?? []), [memberIdsQuery.data]);
  const crms = addCrmsQuery.items ?? [];
  const memberMeta = membersQuery.data?.meta;
  const memberTotalPages = memberMeta?.last_page ?? 1;
  const memberTotal = memberMeta?.total ?? 0;

  const addCandidates = useMemo(
    () => (addLeadsQuery.items ?? []).filter((l) => !memberIds.has(l.id)),
    [addLeadsQuery.items, memberIds],
  );

  const allAddSelected = addCandidates.length > 0 && addCandidates.every((l) => addSelectedIds.has(l.id));
  const someAddSelected = addCandidates.some((l) => addSelectedIds.has(l.id)) && !allAddSelected;

  const toggleAddOne = (leadId: number) => {
    setAddSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const toggleAddAll = () => {
    setAddSelectedIds((prev) => {
      const next = new Set(prev);
      if (allAddSelected) addCandidates.forEach((l) => next.delete(l.id));
      else addCandidates.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const openAddModal = () => {
    setAddSearch('');
    setAddCrmFilter('all');
    setAddStageFilter('all');
    setAddStepSearch('');
    setAddSelectedIds(new Set());
    setAddModalOpen(true);
  };

  const handleAddLeads = async () => {
    if (addSelectedIds.size === 0) return;
    const merged = Array.from(new Set([...members.map((m) => m.id), ...Array.from(addSelectedIds)]));
    try {
      await syncMutation.mutateAsync({ id: groupId, leadIds: merged });
      toast.success(`${addSelectedIds.size} lead(s) adicionado(s) ao grupo.`);
      setAddModalOpen(false);
      setAddSelectedIds(new Set());
    } catch (err) {
      toast.error('Erro ao adicionar leads', err instanceof Error ? err.message : undefined);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    const nextIds = members.filter((m) => m.id !== removeTarget.id).map((m) => m.id);
    try {
      await syncMutation.mutateAsync({ id: groupId, leadIds: nextIds });
      toast.success(`${removeTarget.name} removido do grupo.`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error('Erro ao remover lead', err instanceof Error ? err.message : undefined);
    }
  };

  const templates = templatesQuery.data?.data ?? [];
  const emailConfigs = emailConfigsQuery.data?.data ?? [];
  const whatsappSenders = (whatsappSendersQuery.data?.data ?? []).filter((s) => s.is_active);
  const whatsappTemplates = (whatsappTemplatesQuery.data?.data ?? []).filter((t) => t.is_active);
  const unofficialInstances = (unofficialInstancesQuery.data ?? []).filter((i: { is_active: boolean }) => i.is_active);
  const unofficialTemplates = (unofficialTemplatesQuery.data ?? []).filter((t: { is_active: boolean }) => t.is_active);

  const selectedEmailTemplate = emailTemplateId ? templates.find((t) => t.id === Number(emailTemplateId)) : undefined;
  const selectedEmailConfig = emailConfigId ? emailConfigs.find((c) => c.id === Number(emailConfigId)) : undefined;
  const selectedWhatsappSender = whatsappSenderId ? whatsappSenders.find((s) => s.id === Number(whatsappSenderId)) : undefined;
  const selectedWhatsappTemplate = whatsappTemplateId ? whatsappTemplates.find((t) => t.id === Number(whatsappTemplateId)) : undefined;
  const selectedUnofficialInstance = unofficialInstanceId ? unofficialInstances.find((i) => i.id === Number(unofficialInstanceId)) : undefined;
  const selectedUnofficialTemplate = unofficialTemplateId ? unofficialTemplates.find((t) => t.id === Number(unofficialTemplateId)) : undefined;

  const hasRecipients = memberTotal > 0;
  const emailSendDisabled = !hasRecipients || !emailTemplateId || !emailConfigId;
  const whatsappSendDisabled =
    !hasRecipients ||
    (whatsappProvider === 'official'
      ? !whatsappSenderId || !whatsappTemplateId
      : !unofficialInstanceId || !unofficialTemplateId);
  const isSending = sendEmailMutation.isPending || sendWhatsappMutation.isPending;
  const canDispatch = !sendingBasicForbidden && !isSending && hasRecipients;

  const openSendModal = () => {
    setSendingBasicForbidden(false);
    setSendModalOpen(true);
  };

  const handleSend = async () => {
    if (!hasRecipients) {
      toast.info('Nenhum lead no grupo para disparar.');
      return;
    }
    if (dispatchChannel === 'email') {
      if (!emailTemplateId) { toast.info('Selecione um template de e-mail.'); return; }
      if (!emailConfigId) { toast.info('Selecione uma configuração de e-mail.'); return; }
      try {
        await sendEmailMutation.mutateAsync({ groupId, templateId: Number(emailTemplateId), emailConfigId: Number(emailConfigId) });
        toast.success('Disparo de e-mail enfileirado.');
        setSendModalOpen(false);
      } catch (err: any) {
        if (err?.response?.status === 403) { setSendingBasicForbidden(true); toast.info('Disparo disponível a partir do plano Support.'); return; }
        toast.error('Erro ao enfileirar disparo de e-mail', err instanceof Error ? err.message : undefined);
      }
      return;
    }
    if (whatsappProvider === 'official') {
      if (!whatsappSenderId) { toast.info('Selecione um remetente WhatsApp.'); return; }
      if (!whatsappTemplateId) { toast.info('Selecione um template WhatsApp.'); return; }
    } else {
      if (!unofficialInstanceId) { toast.info('Selecione uma instância não oficial.'); return; }
      if (!unofficialTemplateId) { toast.info('Selecione um template não oficial.'); return; }
    }
    try {
      const payload = whatsappProvider === 'official'
        ? { provider: 'official' as const, whatsapp_sender_id: Number(whatsappSenderId), whatsapp_template_id: Number(whatsappTemplateId) }
        : { provider: 'unofficial' as const, whatsapp_unofficial_instance_id: Number(unofficialInstanceId), whatsapp_unofficial_template_id: Number(unofficialTemplateId) };
      await sendWhatsappMutation.mutateAsync({ groupId, payload });
      toast.success('Disparo de WhatsApp enfileirado.');
      setSendModalOpen(false);
    } catch (err: any) {
      if (err?.response?.status === 403) { setSendingBasicForbidden(true); toast.info('Disparo disponível a partir do plano Support.'); return; }
      toast.error('Erro ao enfileirar disparo de WhatsApp', err instanceof Error ? err.message : undefined);
    }
  };

  if (groupQuery.isPending || membersQuery.isPending) {
    return (
      <div className="space-y-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <TableRowsSkeleton rows={6} cols={4} />
      </div>
    );
  }

  if (groupQuery.isError || !group) {
    return (
      <ErrorState
        title="Erro ao carregar grupo"
        error={groupQuery.error}
        onRetry={() => { void groupQuery.refetch(); void membersQuery.refetch(); }}
      />
    );
  }

  return (
    <div className="space-y-5 py-6">
      <Link
        to="/disparos"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para Disparos</span>
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/15">
            <UsersRound className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">Grupo de disparo</p>
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{group.name}</h1>
            {group.description && <p className="mt-0.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">{group.description}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
                {memberTotal} {memberTotal === 1 ? 'lead' : 'leads'}
              </span>
              {(group as any).template_name && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-3 py-1 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                  <Mail className="h-3 w-3" strokeWidth={2} />
                  {(group as any).template_name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            component={Link}
            to={`/disparos/${groupId}/historico`}
            variant="outlined"
            color="inherit"
            startIcon={<History className="h-4 w-4" strokeWidth={2} />}
            sx={{ flexShrink: 0, fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
          >
            Histórico
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Zap className="h-4 w-4" strokeWidth={2} />}
            disabled={!canDispatch}
            onClick={openSendModal}
            sx={{ flexShrink: 0, fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
          >
            Disparar grupo
          </Button>
        </div>
      </div>

      {sendingBasicForbidden && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-200">
          Disparo disponível a partir do plano <strong>Basic</strong>.{' '}
          <Link to="/billing" className="font-semibold underline underline-offset-2">Ver planos</Link>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-950/[0.08] bg-white dark:border-white/[0.08] dark:bg-[#17171a]">
        <div className="flex flex-col gap-3 border-b border-zinc-950/[0.06] px-5 py-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Leads do grupo</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Gerencie os leads que receberão os disparos deste grupo.
            </p>
          </div>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<UserPlus className="h-4 w-4" strokeWidth={2} />}
            onClick={openAddModal}
            sx={{ flexShrink: 0, fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
          >
            Adicionar leads
          </Button>
        </div>

        <div className="border-b border-zinc-950/[0.06] px-5 py-3 dark:border-white/[0.06]">
          <SearchField
            value={memberSearch}
            onChange={setMemberSearch}
            placeholder="Buscar por nome, e-mail ou telefone..."
            ariaLabel="Buscar leads do grupo"
            className="max-w-md"
          />
        </div>

        {members.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<UsersRound className="h-5 w-5" />}
              title={memberTotal === 0 && !debouncedMemberSearch ? 'Nenhum lead no grupo' : 'Nenhum lead encontrado'}
              description={memberTotal === 0 && !debouncedMemberSearch ? 'Adicione leads para começar a disparar campanhas para este grupo.' : 'Tente outro termo de busca.'}
              action={memberTotal === 0 && !debouncedMemberSearch ? (
                <Button variant="contained" color="primary" startIcon={<UserPlus className="h-4 w-4" />} onClick={openAddModal} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  Adicionar leads
                </Button>
              ) : undefined}
            />
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-950/[0.06] bg-zinc-50/70 text-xs font-medium text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400">
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium">CRM / Etapa</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                {members.map((lead) => (
                  <tr key={lead.id} className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{lead.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{lead.email}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{lead.phone ? maskPhone(lead.phone) : '—'}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">
                      <span className="block truncate">{lead.crm_name || '—'}</span>
                      <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">{lead.step_name || ''}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <TableActionsMenu
                        label={`Ações de ${lead.name}`}
                        actions={[
                          {
                            label: 'Remover do grupo',
                            icon: <Trash2 className="h-4 w-4" strokeWidth={1.8} />,
                            tone: 'danger',
                            onClick: () => setRemoveTarget({ id: lead.id, name: lead.name }),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
            <Pagination
              page={memberPage}
              lastPage={memberTotalPages}
              total={memberTotal}
              from={memberMeta?.from ?? null}
              to={memberMeta?.to ?? null}
              onPageChange={setMemberPage}
              ariaLabel="Paginação dos leads do grupo"
            />
          </div>
          </>
        )}
      </section>


      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Adicionar leads ao grupo"
        description="Filtre por CRM/etapa, selecione os leads e adicione ao grupo."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SearchField
              value={addSearch}
              onChange={setAddSearch}
              placeholder="Buscar por nome ou e-mail..."
              ariaLabel="Buscar leads"
              className="sm:col-span-1"
            />
            <Autocomplete
              value={addCrmFilter === 'all' ? '' : String(addCrmFilter)}
              onChange={(value) => { setAddCrmFilter(value === '' ? 'all' : Number(value)); setAddStageFilter('all'); }}
              ariaLabel="Filtrar por CRM"
              emptyLabel="Todos os CRMs"
              options={crms.map((crm) => ({ value: String(crm.id), label: crm.name }))}
              onOpen={() => setAddCrmOpen(true)}
              loading={addCrmsQuery.isFetching && addCrmOpen}
              className="w-full"
            />
            <Autocomplete
              value={addStageFilter === 'all' ? '' : String(addStageFilter)}
              onChange={(value) => setAddStageFilter(value === '' ? 'all' : Number(value))}
              ariaLabel="Filtrar por etapa"
              emptyLabel="Todas as etapas"
              options={(addStepsQuery.data ?? []).map((step) => ({ value: String(step.id), label: `${step.crm_name} — ${step.name}` }))}
              placeholder="Etapa..."
              emptyMessage="Nenhuma etapa encontrada"
              onSearch={setAddStepSearch}
              onOpen={() => setAddStepOpen(true)}
              loading={addStepsQuery.isFetching}
              className="w-full"
            />
          </div>

          <div className="max-h-[420px] overflow-auto rounded-xl border border-zinc-950/[0.08] dark:border-white/[0.08]">
            {!addLeadsEnabled ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Selecione um CRM ou uma etapa para buscar leads.
              </p>
            ) : addLeadsQuery.isPending ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />)}
              </div>
            ) : addLeadsQuery.isError ? (
              <div className="p-4">
                <ErrorState title="Erro ao carregar leads" error={addLeadsQuery.error} onRetry={() => void addLeadsQuery.refetch()} />
              </div>
            ) : addCandidates.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                {(addLeadsQuery.items ?? []).length === 0 ? 'Nenhum lead encontrado para os filtros.' : 'Todos os leads desta página já estão no grupo.'}
              </p>
            ) : (
              <>
                <div className="sticky top-0 z-10 border-b border-zinc-950/[0.06] bg-zinc-50/95 px-4 py-2.5 backdrop-blur dark:border-white/[0.06] dark:bg-[#1c1c1f]/95">
                  <label className="inline-flex cursor-pointer items-center gap-3">
                    <Checkbox checked={allAddSelected} indeterminate={someAddSelected} onChange={toggleAddAll} size="small" sx={{ p: 0 }} />
                    <span className="text-[13px] font-medium text-zinc-600 dark:text-zinc-300">Selecionar todos nesta página ({addCandidates.length})</span>
                  </label>
                </div>
                <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                  {addCandidates.map((lead) => {
                    const checked = addSelectedIds.has(lead.id);
                    return (
                      <li key={lead.id}>
                        <label className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${checked ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.02]'}`}>
                          <Checkbox checked={checked} onChange={() => toggleAddOne(lead.id)} size="small" sx={{ p: 0, flexShrink: 0 }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{lead.name}</span>
                            <span className="block truncate text-[12px] text-zinc-400 dark:text-zinc-500">
                              {lead.email}{lead.crm_name ? ` · ${lead.crm_name}` : ''}{lead.step_name ? ` / ${lead.step_name}` : ''}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
          {addLeadsEnabled && (addLeadsQuery.meta?.total ?? 0) > 0 && (
            <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
              <Pagination
                page={addLeadsQuery.meta.current_page}
                lastPage={addLeadsQuery.meta.last_page}
                total={addLeadsQuery.meta.total}
                from={addLeadsQuery.meta.from}
                to={addLeadsQuery.meta.to}
                onPageChange={setAddPage}
                ariaLabel="Paginação de leads para adicionar"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{addSelectedIds.size} selecionado(s)</p>
            <div className="flex gap-3">
              <Button variant="outlined" color="inherit" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
              <Button
                variant="contained"
                color="primary"
                disabled={addSelectedIds.size === 0 || syncMutation.isPending}
                onClick={() => void handleAddLeads()}
                startIcon={syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Adicionar selecionados
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void handleRemoveMember()}
        title="Remover lead do grupo"
        description={removeTarget ? `Remover "${removeTarget.name}" deste grupo?` : ''}
        confirmLabel="Remover"
        variant="danger"
        isPending={syncMutation.isPending}
      />

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
              onChange={(value) => { if (value === 'email' || value === 'whatsapp') setDispatchChannel(value); }}
              ariaLabel="Canal de disparo"
              placeholder="Selecione o canal"
              options={[{ value: 'email', label: 'E-mail' }, { value: 'whatsapp', label: 'WhatsApp' }]}
              clearable={false}
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
                    options={templates.map((t) => ({ value: String(t.id), label: t.name, description: t.description || undefined }))}
                    loading={templatesQuery.isFetching}
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
                    options={emailConfigs.map((c) => ({ value: String(c.id), label: c.name, description: `${c.from_name} <${c.from_address}>` }))}
                    loading={emailConfigsQuery.isFetching}
                    className="w-full"
                  />
                </div>
              </div>
              {!templatesQuery.isFetching && templates.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Nenhum template de e-mail encontrado. <Link to="/sending-templates" onClick={() => setSendModalOpen(false)} className="font-semibold underline underline-offset-2">Configurar templates</Link>
                </p>
              )}
              {!emailConfigsQuery.isFetching && emailConfigs.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Nenhuma configuração de e-mail encontrada. <Link to="/email-configs" onClick={() => setSendModalOpen(false)} className="font-semibold underline underline-offset-2">Configurar e-mail (SMTP)</Link>
                </p>
              )}
              <dl className="divide-y divide-zinc-950/[0.06] rounded-xl border border-zinc-950/[0.08] dark:divide-white/[0.06] dark:border-white/[0.08]">
                {[
                  ['Canal', 'E-mail'],
                  ['Template', selectedEmailTemplate?.name ?? '—'],
                  ['Remetente', selectedEmailConfig ? `${selectedEmailConfig.from_name} <${selectedEmailConfig.from_address}>` : '—'],
                  ['Destinatários', `${memberTotal} ${memberTotal === 1 ? 'lead' : 'leads'}`],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
                    <dd className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <>
              <div className="max-w-xs">
                <span className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Provedor WhatsApp</span>
                <Autocomplete
                  value={whatsappProvider}
                  onChange={(value) => { if (value === 'official' || value === 'unofficial') setWhatsappProvider(value); }}
                  ariaLabel="Provedor WhatsApp"
                  options={[{ value: 'official', label: 'Oficial (Meta Cloud API) — Bloqueado', disabled: true }, { value: 'unofficial', label: 'Não oficial (Microserviço)' }]}
                  clearable={false}
                  className="w-full"
                />
              </div>

              {whatsappProvider === 'official' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Remetente WhatsApp</span>
                    <Autocomplete
                      value={whatsappSenderId === '' ? '' : String(whatsappSenderId)}
                      onChange={(value) => setWhatsappSenderId(value ? Number(value) : '')}
                      ariaLabel="Remetente WhatsApp"
                      placeholder="Selecione um remetente ativo"
                      emptyMessage="Nenhum remetente ativo encontrado"
                      options={whatsappSenders.map((s) => ({ value: String(s.id), label: `${s.name}${s.phone_number ? ` (${s.phone_number})` : ''}`, description: s.phone_number_id ? `ID: ${s.phone_number_id}` : undefined }))}
                      loading={whatsappSendersQuery.isFetching}
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
                      options={whatsappTemplates.map((t) => ({ value: String(t.id), label: `${t.name} (${t.language})`, description: t.category || undefined }))}
                      loading={whatsappTemplatesQuery.isFetching}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Instância WhatsApp (não oficial)</span>
                    <Autocomplete
                      value={unofficialInstanceId === '' ? '' : String(unofficialInstanceId)}
                      onChange={(value) => setUnofficialInstanceId(value ? Number(value) : '')}
                      ariaLabel="Instância WhatsApp não oficial"
                      placeholder="Selecione uma instância ativa"
                      emptyMessage="Nenhuma instância ativa encontrada"
                      options={unofficialInstances.map((i) => ({ value: String(i.id), label: `${i.name}${i.phone_number ? ` (${i.phone_number})` : ''}`, description: i.status }))}
                      loading={unofficialInstancesQuery.isFetching}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">Template WhatsApp (não oficial)</span>
                    <Autocomplete
                      value={unofficialTemplateId === '' ? '' : String(unofficialTemplateId)}
                      onChange={(value) => setUnofficialTemplateId(value ? Number(value) : '')}
                      ariaLabel="Template WhatsApp não oficial"
                      placeholder="Selecione um template ativo"
                      emptyMessage="Nenhum template ativo encontrado"
                      options={unofficialTemplates.map((t) => ({ value: String(t.id), label: t.name, description: t.body ? t.body.slice(0, 60) : undefined }))}
                      loading={unofficialTemplatesQuery.isFetching}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              <dl className="divide-y divide-zinc-950/[0.06] rounded-xl border border-zinc-950/[0.08] dark:divide-white/[0.06] dark:border-white/[0.08]">
                {[
                  ['Canal', whatsappProvider === 'unofficial' ? 'WhatsApp (Não oficial)' : 'WhatsApp (Oficial)'],
                  whatsappProvider === 'unofficial'
                    ? ['Instância', selectedUnofficialInstance ? `${selectedUnofficialInstance.name}${selectedUnofficialInstance.phone_number ? ` (${selectedUnofficialInstance.phone_number})` : ''}` : '—']
                    : ['Remetente', selectedWhatsappSender ? `${selectedWhatsappSender.name}${selectedWhatsappSender.phone_number ? ` (${selectedWhatsappSender.phone_number})` : ''}` : '—'],
                  whatsappProvider === 'unofficial'
                    ? ['Template', selectedUnofficialTemplate?.name ?? '—']
                    : ['Template', selectedWhatsappTemplate ? `${selectedWhatsappTemplate.name} (${selectedWhatsappTemplate.language})` : '—'],
                  ['Destinatários', `${memberTotal} ${memberTotal === 1 ? 'lead' : 'leads'}`],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                    <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
                    <dd className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outlined" color="inherit" onClick={() => setSendModalOpen(false)} sx={{ width: { xs: '100%', sm: 'auto' } }}>Cancelar</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => void handleSend()}
              disabled={isSending || (dispatchChannel === 'email' ? emailSendDisabled : whatsappSendDisabled)}
              startIcon={isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Confirmar disparo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
