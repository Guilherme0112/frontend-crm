import Button from '@mui/material/Button';
import { TableActionButton } from '@/src/components/common/TableActionButton';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  useCreateEmailConfigMutation,
  useDeleteEmailConfigMutation,
  useEmailConfigsQuery,
  useUpdateEmailConfigMutation,
} from './hooks';
import { EmailConfigForm, type EmailConfigFormValues } from './EmailConfigForm';
import { useSubscriptionsFullQuery } from '@/src/features/billing/hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage, getApiStatus } from '@/src/lib/formErrors';
import { formatDate } from '@/src/lib/format';
import type { CreateEmailConfigInput, EmailConfig, UpdateEmailConfigInput } from '@/src/lib/types';

const ENCRYPTION_LABEL: Record<EmailConfig['encryption'], string> = {
  tls: 'TLS',
  ssl: 'SSL',
  none: 'Nenhum',
};

function UpsellIsland() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-950/[0.07] bg-white px-6 py-16 text-center dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/10">
        <Mail className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Envio por email é exclusivo do Basic
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Desbloqueie SMTP próprio, grupos e templates para disparar suas cadências direto
          pelo Vértice.
        </p>
      </div>
      <Link
        to="/billing"
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Ver planos
      </Link>
    </div>
  );
}

export function EmailConfigsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const configsQuery = useEmailConfigsQuery(page);
  const subscriptionsQuery = useSubscriptionsFullQuery();
  const createMutation = useCreateEmailConfigMutation();
  const updateMutation = useUpdateEmailConfigMutation();
  const deleteMutation = useDeleteEmailConfigMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<EmailConfig | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);
  const [trialForbidden, setTrialForbidden] = useState(false);

  // Só a assinatura vigente decide. Olhar a lista inteira mantinha o upsell no
  // ar para sempre depois de uma troca de plano: a linha antiga continua no
  // histórico, e quem já paga via o aviso de "exclusivo do Basic".
  const currentSubscription =
    (subscriptionsQuery.items ?? []).find(
      (s) => s.status === 'active' || s.status === 'trialing',
    ) ?? null;
  const isTrial = currentSubscription?.status === 'trialing' || trialForbidden;

  const openCreateModal = () => {
    setEditingConfig(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEditModal = (config: EmailConfig) => {
    setEditingConfig(config);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (values: EmailConfigFormValues) => {
    const { password, ...rest } = values;
    try {
      if (editingConfig) {
        const payload: UpdateEmailConfigInput = { ...rest };
        if (password) payload.password = password;
        await updateMutation.mutateAsync({ id: editingConfig.id, payload });
        toast.success('Configuração atualizada');
      } else {
        const payload: CreateEmailConfigInput = { ...rest, password };
        await createMutation.mutateAsync(payload);
        toast.success('Configuração criada');
      }
      setModalOpen(false);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setModalOpen(false);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      setSubmitError(error);
      toast.error('Erro ao salvar configuração', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingConfig) return;
    try {
      await deleteMutation.mutateAsync(deletingConfig.id);
      toast.success('Configuração removida; grupos vinculados ficaram sem configuração');
      setDeletingConfig(null);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setDeletingConfig(null);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Erro ao excluir configuração', getApiErrorMessage(error));
    }
  };

  const configs = configsQuery.data?.data ?? [];
  const meta = configsQuery.data?.meta ?? null;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  // Excluir a última configuração de uma página deixa a página sem conteúdo.
  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page));
    }
  }, [meta, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/disparos"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Disparos</span>
          </Link>
          <p className="eyebrow mt-2 text-zinc-400 dark:text-zinc-500">Operação</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Configuração de e-mail
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Servidores SMTP usados pelos grupos para enviar seus templates de mensagem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/sending-templates"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <FileText className="h-4 w-4" strokeWidth={1.8} />
            <span>Configurar templates</span>
          </Link>
          {!isTrial && (
            <Button variant="contained" color="primary" startIcon={<Plus className="h-4 w-4" strokeWidth={2.2} />} onClick={openCreateModal} className="shrink-0 whitespace-nowrap">
              Nova configuração
            </Button>
          )}
        </div>
      </div>

      {isTrial ? (
        <UpsellIsland />
      ) : configsQuery.isPending ? (
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={3} cols={6} />
        </div>
      ) : configsQuery.isError ? (
        <ErrorState
          title="Erro ao carregar configurações"
          error={configsQuery.error}
          onRetry={() => void configsQuery.refetch()}
        />
      ) : configs.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-5 w-5" />}
          title="Nenhum SMTP configurado"
          description="Cadastre um servidor SMTP para que os grupos possam enviar os templates de email."
          action={
            <Button variant="contained" color="primary" startIcon={<Plus className="h-4 w-4" strokeWidth={2.2} />} onClick={openCreateModal}>
              Criar primeira configuração
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Host:Porta</th>
                <th className="px-5 py-3">Criptografia</th>
                <th className="px-5 py-3">Usuário</th>
                <th className="px-5 py-3">Remetente</th>
                <th className="px-5 py-3">Senha</th>
                <th className="px-5 py-3">Criada em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {configs.map((config) => (
                <tr
                  key={config.id}
                  className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-950/[0.04] text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400"
                        aria-hidden="true"
                      >
                        <Mail className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      {config.name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {config.host}:{config.port}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                      {ENCRYPTION_LABEL[config.encryption]}
                    </span>
                  </td>
                  <td className="max-w-[160px] truncate px-5 py-3.5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {config.username}
                  </td>
                  <td className="max-w-[220px] truncate px-5 py-3.5 text-zinc-600 dark:text-zinc-400" title={`${config.from_name} <${config.from_address}>`}>
                    {config.from_name}{' '}
                    <span className="text-zinc-400 dark:text-zinc-500">&lt;{config.from_address}&gt;</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {config.has_password ? (
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400" title="Senha definida (não exibida)">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ••••••••
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                    {formatDate(config.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <TableActionButton tone="primary" onClick={() => openEditModal(config)} aria-label={`Editar ${config.name}`}>
                        <Pencil className="h-4 w-4" />
                      </TableActionButton>
                      <TableActionButton tone="error" onClick={() => setDeletingConfig(config)} aria-label={`Excluir ${config.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </TableActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={meta?.current_page ?? page}
          lastPage={lastPage}
          total={total}
          from={meta?.from ?? null}
          to={meta?.to ?? null}
          onPageChange={setPage}
          ariaLabel="Paginação de configurações de e-mail"
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingConfig ? 'Editar configuração de email' : 'Nova configuração de email'}
        description="O Vértice nunca exibe a senha cadastrada — ela é usada apenas no envio."
        size="lg"
      >
        <EmailConfigForm
          key={editingConfig?.id ?? 'new'}
          initialConfig={editingConfig}
          isSubmitting={isMutating}
          submitError={submitError}
          onSubmit={(values) => void handleSubmit(values)}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingConfig)}
        onClose={() => setDeletingConfig(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir configuração"
        description={`Tem certeza que deseja excluir "${deletingConfig?.name ?? ''}"? Os grupos vinculados ficarão sem configuração de SMTP.`}
        confirmLabel="Excluir configuração"
      />

    </div>
  );
}
