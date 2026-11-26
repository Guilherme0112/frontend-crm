import ActionButton from '@/src/components/common/Button';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
import {
  useCreateWhatsappTemplateMutation,
  useDeleteWhatsappTemplateMutation,
  useUpdateWhatsappTemplateMutation,
  useWhatsappTemplatesQuery,
} from './hooks';
import { WhatsappTemplateForm, type WhatsappTemplateFormValues } from './WhatsappTemplateForm';
import { useSubscriptionsFullQuery } from '@/src/features/billing/hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage, getApiStatus } from '@/src/lib/formErrors';
import type { WhatsappTemplate } from '@/src/lib/types';

const PER_PAGE = 10;

function UpsellIsland() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-zinc-950/[0.07] bg-white px-6 py-16 text-center dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/10">
        <FileText className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Templates WhatsApp são exclusivos do Basic
        </h2>
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Cadastre templates aprovados na Meta e dispare campanhas de WhatsApp para seus grupos.
        </p>
      </div>
      <Link
        to="/billing"
        className="btn-saldup inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
      >
        Ver planos
      </Link>
    </div>
  );
}

function toPayload(values: WhatsappTemplateFormValues) {
  return {
    name: values.name,
    language: values.language,
    category: values.category || null,
    is_active: values.is_active,
    variable_mapping: values.body_fields.length > 0 ? { body: values.body_fields } : {},
  };
}

export function WhatsappTemplatesPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WhatsappTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsappTemplate | null>(null);
  const [trialForbidden, setTrialForbidden] = useState(false);

  const subscriptionsQuery = useSubscriptionsFullQuery();
  const templatesQuery = useWhatsappTemplatesQuery(page, PER_PAGE);
  const createMutation = useCreateWhatsappTemplateMutation();
  const updateMutation = useUpdateWhatsappTemplateMutation();
  const deleteMutation = useDeleteWhatsappTemplateMutation();

  const currentSubscription =
    (subscriptionsQuery.items ?? []).find((s) => s.status === 'active' || s.status === 'trialing') ?? null;
  const isTrial = currentSubscription?.status === 'trialing' || trialForbidden;

  const templates = templatesQuery.data?.data ?? [];
  const meta = templatesQuery.data?.meta;

  const handleCreate = async (values: WhatsappTemplateFormValues) => {
    try {
      await createMutation.mutateAsync(toPayload(values));
      toast.success('Template criado');
      setCreateOpen(false);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setCreateOpen(false);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível criar o template', getApiErrorMessage(error));
    }
  };

  const handleUpdate = async (values: WhatsappTemplateFormValues) => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload: toPayload(values) });
      toast.success('Template atualizado');
      setEditTarget(null);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setEditTarget(null);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível atualizar o template', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Template excluído');
      setDeleteTarget(null);
    } catch (error) {
      if (getApiStatus(error) === 403) {
        setTrialForbidden(true);
        setDeleteTarget(null);
        toast.error('Recurso do plano Basic', getApiErrorMessage(error));
        return;
      }
      toast.error('Não foi possível excluir o template', getApiErrorMessage(error));
    }
  };

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            to="/disparos"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Disparos</span>
          </Link>
          <p className="eyebrow mt-2 text-zinc-400 dark:text-zinc-500">Operação</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Templates WhatsApp
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre templates aprovados na Meta e mapeie variáveis dinâmicas para campos do lead.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link
            to="/whatsapp-senders"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 sm:w-auto dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.8} />
            <span>Remetentes</span>
          </Link>
          {!isTrial && (
            <ActionButton
              disabled
              startIcon={<Plus className="h-4 w-4" />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Novo template
            </ActionButton>
          )}
        </div>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        <strong>WhatsApp oficial bloqueado.</strong> Esta área está temporariamente indisponível. Use o WhatsApp não oficial.
      </div>

      {isTrial ? (
        <UpsellIsland />
      ) : templatesQuery.isPending ? (
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={4} cols={5} />
        </div>
      ) : templatesQuery.isError ? (
        <ErrorState title="Erro ao carregar templates" error={templatesQuery.error} onRetry={() => void templatesQuery.refetch()} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Nenhum template WhatsApp"
          description="Cadastre um template aprovado na Meta para usá-lo nos disparos de grupos."
          action={
            <ActionButton disabled startIcon={<Plus className="h-4 w-4" />}>
              Criar primeiro template
            </ActionButton>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="overflow-x-auto">
            <table className="min-w-full min-w-[640px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-white/[0.03] dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nome</th>
                  <th className="px-5 py-3 font-semibold">Idioma</th>
                  <th className="px-5 py-3 font-semibold">Categoria</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                {templates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-zinc-100">{tpl.name}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{tpl.language}</td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300">{tpl.category || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={tpl.is_active ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'}>
                        {tpl.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <TableActionsMenu
                        label={`Ações de ${tpl.name}`}
                        actions={[
                          {
                            label: 'Editar',
                            icon: <Pencil className="h-4 w-4" />,
                            onClick: () => setEditTarget(tpl),
                          },
                          {
                            label: 'Excluir',
                            icon: <Trash2 className="h-4 w-4" />,
                            tone: 'danger',
                            onClick: () => setDeleteTarget(tpl),
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
              page={meta?.current_page ?? 1}
              lastPage={meta?.last_page ?? 1}
              total={meta?.total ?? 0}
              from={meta?.from ?? null}
              to={meta?.to ?? null}
              onPageChange={setPage}
              ariaLabel="Paginação de templates WhatsApp"
            />
          </div>
        </section>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo template WhatsApp" description="Cadastre um template aprovado na Meta e mapeie as variáveis do corpo." size="lg">
        <WhatsappTemplateForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} submitting={createMutation.isPending} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar template WhatsApp" description="Atualize os dados e o mapeamento de variáveis." size="lg">
        <WhatsappTemplateForm key={editTarget?.id ?? 'edit'} initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} submitting={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir template"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name ?? ''}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
