import Button from '@mui/material/Button';
import { TableActionButton } from '@/src/components/common/TableActionButton';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateWhatsappSenderMutation,
  useDeleteWhatsappSenderMutation,
  useUpdateWhatsappSenderMutation,
  useWhatsappSendersQuery,
} from './hooks';
import { WhatsappSenderForm, type WhatsappSenderFormValues } from './WhatsappSenderForm';
import { useSubscriptionsFullQuery } from '@/src/features/billing/hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage, getApiStatus } from '@/src/lib/formErrors';
import type { WhatsappSender } from '@/src/lib/types';

const PER_PAGE = 10;

function UpsellIsland() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-950/[0.07] bg-white px-6 py-16 text-center dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/10">
        <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          WhatsApp é exclusivo do Basic
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Desbloqueie remetentes, templates e disparos de WhatsApp para seus grupos de leads.
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

export function WhatsappSendersPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WhatsappSender | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsappSender | null>(null);
  const [trialForbidden, setTrialForbidden] = useState(false);

  const subscriptionsQuery = useSubscriptionsFullQuery();
  const sendersQuery = useWhatsappSendersQuery(page, PER_PAGE);
  const createMutation = useCreateWhatsappSenderMutation();
  const updateMutation = useUpdateWhatsappSenderMutation();
  const deleteMutation = useDeleteWhatsappSenderMutation();

  const currentSubscription =
    (subscriptionsQuery.items ?? []).find((s) => s.status === 'active' || s.status === 'trialing') ?? null;
  const isTrial = currentSubscription?.status === 'trialing' || trialForbidden;

  const senders = sendersQuery.data?.data ?? [];
  const meta = sendersQuery.data?.meta;

  const handleCreate = async (values: WhatsappSenderFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        phone_number: values.phone_number || null,
        phone_number_id: values.phone_number_id,
        access_token: values.access_token,
        is_active: values.is_active,
      });
      toast.success('Remetente criado');
      setCreateOpen(false);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setCreateOpen(false);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível criar o remetente', getApiErrorMessage(error));
    }
  };

  const handleUpdate = async (values: WhatsappSenderFormValues) => {
    if (!editTarget) return;
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        phone_number: values.phone_number || null,
        phone_number_id: values.phone_number_id,
        is_active: values.is_active,
      };
      if (values.access_token.trim()) payload.access_token = values.access_token;
      await updateMutation.mutateAsync({ id: editTarget.id, payload: payload as any });
      toast.success('Remetente atualizado');
      setEditTarget(null);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setEditTarget(null);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível atualizar o remetente', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Remetente excluído');
      setDeleteTarget(null);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setDeleteTarget(null);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível excluir o remetente', getApiErrorMessage(error));
    }
  };

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
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
            Configuração de WhatsApp
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre os remetentes da Meta Cloud API (Phone Number ID e token) usados nos disparos de WhatsApp para grupos de leads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/whatsapp-templates"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <FileText className="h-4 w-4" strokeWidth={1.8} />
            <span>Configurar templates</span>
          </Link>
          {!isTrial && (
            <Button variant="contained" color="primary" onClick={() => setCreateOpen(true)} startIcon={<Plus className="h-4 w-4" />}>
              Novo remetente
            </Button>
          )}
        </div>
      </header>

      {isTrial ? (
        <UpsellIsland />
      ) : sendersQuery.isPending ? (
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={4} cols={5} />
        </div>
      ) : sendersQuery.isError ? (
        <ErrorState title="Erro ao carregar remetentes" error={sendersQuery.error} onRetry={() => void sendersQuery.refetch()} />
      ) : senders.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-5 w-5" />}
          title="Nenhum remetente WhatsApp"
          description="Cadastre um remetente (Phone Number ID + token da Meta) para habilitar disparos por WhatsApp."
          action={
            <Button variant="contained" color="primary" onClick={() => setCreateOpen(true)} startIcon={<Plus className="h-4 w-4" />}>
              Criar primeiro remetente
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[0.03] dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nome</th>
                  <th className="px-5 py-3 font-semibold">Número</th>
                  <th className="px-5 py-3 font-semibold">Phone Number ID</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                {senders.map((sender) => (
                  <tr key={sender.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">{sender.name}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{sender.phone_number || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-300">{sender.phone_number_id}</td>
                    <td className="px-5 py-3">
                      <span className={sender.is_active ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'}>
                        {sender.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <TableActionButton title="Editar" aria-label={`Editar ${sender.name}`} tone="neutral" onClick={() => setEditTarget(sender)}>
                          <Pencil className="h-4 w-4" />
                        </TableActionButton>
                        <TableActionButton title="Excluir" aria-label={`Excluir ${sender.name}`} tone="error" onClick={() => setDeleteTarget(sender)}>
                          <Trash2 className="h-4 w-4" />
                        </TableActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-950/[0.06] px-5 py-3 dark:border-white/[0.06]">
            <Pagination
              page={meta?.current_page ?? 1}
              lastPage={meta?.last_page ?? 1}
              total={meta?.total ?? 0}
              from={meta?.from ?? null}
              to={meta?.to ?? null}
              onPageChange={setPage}
              ariaLabel="Paginação de remetentes WhatsApp"
            />
          </div>
        </section>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo remetente WhatsApp" description="Informe os dados do número remetente configurado na Meta Cloud API." size="lg">
        <WhatsappSenderForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitting={createMutation.isPending} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar remetente WhatsApp" description="Atualize os dados do remetente. O token só é alterado se você informar um novo." size="lg">
        <WhatsappSenderForm key={editTarget?.id ?? 'edit'} initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} submitting={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir remetente"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
