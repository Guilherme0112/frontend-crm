import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, BarChart3, FolderKanban, Pencil, Plus, Trash2, Webhook } from 'lucide-react';
import {
  useCreateCrmMutation,
  useCrmsInfiniteQuery,
  useDeleteCrmMutation,
  useUpdateCrmMutation,
} from './hooks';
import { Modal } from '@/src/components/common/Modal';
import { LoadMoreButton } from '@/src/components/common/LoadMoreButton';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { CardsGridSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { HEX_COLOR_REGEX, formatDate } from '@/src/lib/format';
import type { Crm } from '@/src/lib/types';

const PRESET_COLORS = ['#2563eb', '#0d9488', '#d97706', '#dc2626', '#4f46e5', '#0f172a'];

const crmSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do CRM'),
  description: z.string().optional(),
  color: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || HEX_COLOR_REGEX.test(val), {
      message: 'Use um código hexadecimal válido (ex.: #2563eb)',
    }),
});

type CrmFormValues = z.infer<typeof crmSchema>;

export function CrmsPage() {
  const { toast } = useToast();
  const crmsQuery = useCrmsInfiniteQuery();
  const createMutation = useCreateCrmMutation();
  const updateMutation = useUpdateCrmMutation();
  const deleteMutation = useDeleteCrmMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCrm, setEditingCrm] = useState<Crm | null>(null);
  const [deletingCrm, setDeletingCrm] = useState<Crm | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CrmFormValues>({
    resolver: zodResolver(crmSchema),
    defaultValues: { name: '', description: '', color: '#2563eb' },
  });

  const selectedColor = watch('color') || '#2563eb';

  const openCreateModal = () => {
    setEditingCrm(null);
    reset({ name: '', description: '', color: '#2563eb' });
    setModalOpen(true);
  };

  const openEditModal = (crm: Crm) => {
    setEditingCrm(crm);
    reset({
      name: crm.name,
      description: crm.description ?? '',
      color: crm.color || '#2563eb',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CrmFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      color: values.color?.trim() || '#2563eb',
    };

    try {
      if (editingCrm) {
        await updateMutation.mutateAsync({ id: editingCrm.id, payload });
        toast.success('CRM atualizado');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('CRM criado');
      }
      setModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar CRM', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingCrm) return;
    try {
      await deleteMutation.mutateAsync(deletingCrm.id);
      toast.success('CRM excluído');
      setDeletingCrm(null);
    } catch (error) {
      toast.error('Erro ao excluir CRM', getApiErrorMessage(error));
    }
  };

  const crms = crmsQuery.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Operação</p>
          <div className="mt-1.5 flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              CRMs
            </h1>
            {!crmsQuery.isPending && crms.length > 0 && (
              <span className="rounded-full border border-zinc-950/[0.08] bg-white px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-zinc-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400">
                {crms.length}
              </span>
            )}
          </div>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie seus funis de atendimento, tokens de integração e quadros Kanban.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/crms/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            <span>Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700 whitespace-nowrap dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            <span>Novo CRM</span>
          </button>
        </div>
      </div>

      {crmsQuery.isPending ? (
        <CardsGridSkeleton count={3} />
      ) : crmsQuery.isError ? (
        <ErrorState
          title="Erro ao carregar CRMs"
          error={crmsQuery.error}
          onRetry={() => void crmsQuery.refetch()}
        />
      ) : crms.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="Nenhum CRM encontrado"
          description="Crie seu primeiro CRM para configurar etapas personalizadas e acompanhar seus leads."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              <span>Criar primeiro CRM</span>
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {crms.map((crm) => {
            const color = crm.color || '#2563eb';
            return (
            <article
              key={crm.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-950/[0.14] hover:shadow-[var(--shadow-pop)] dark:border-white/[0.07] dark:bg-[#17171a] dark:hover:border-white/[0.14]"
            >
              {/* Color accent bar */}
              <div
                aria-hidden="true"
                className="h-1.5 w-full"
                style={{ background: `linear-gradient(90deg, ${color} 0%, ${color}55 100%)` }}
              />

              <div className="p-5 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950/[0.04] ring-1 ring-inset ring-zinc-950/[0.06] dark:bg-white/[0.05] dark:ring-white/[0.07]"
                      aria-hidden="true"
                    >
                      <FolderKanban className="h-5 w-5" strokeWidth={1.8} style={{ color }} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {crm.name}
                      </h2>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                        Criado em {formatDate(crm.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEditModal(crm)}
                      aria-label={`Editar ${crm.name}`}
                      title="Editar CRM"
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-950/[0.05] hover:text-zinc-700 dark:hover:bg-white/[0.07] dark:hover:text-zinc-200"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCrm(crm)}
                      aria-label={`Excluir ${crm.name}`}
                      title="Excluir CRM"
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>

                <p className="mt-3.5 min-h-[3rem] line-clamp-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {crm.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 border-t border-zinc-950/[0.06] p-3 dark:border-white/[0.07]">
                <Link
                  to={`/crms/${crm.id}/board`}
                  className="group/link flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-950/[0.04] hover:text-zinc-950 dark:text-zinc-200 dark:hover:bg-white/[0.05] dark:hover:text-white"
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="truncate">Abrir quadro Kanban</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 transition-all duration-200 group-hover/link:translate-x-0.5 group-hover/link:text-zinc-700 dark:group-hover/link:text-zinc-100" strokeWidth={2} />
                </Link>
                <Link
                  to={`/crms/${crm.id}/dashboard`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-950/[0.08] text-zinc-500 transition-colors hover:bg-zinc-950/[0.04] hover:text-zinc-900 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                  aria-label={`Dashboard: ${crm.name}`}
                  title="Dashboard"
                >
                  <BarChart3 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </Link>
                <Link
                  to={`/crms/${crm.id}/integration`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-950/[0.08] text-zinc-500 transition-colors hover:bg-zinc-950/[0.04] hover:text-zinc-900 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                  aria-label={`Integração pública: ${crm.name}`}
                  title="Integração pública"
                >
                  <Webhook className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {crmsQuery.hasNextPage && (
        <LoadMoreButton
          total={crmsQuery.total}
          loaded={crms.length}
          isFetchingNextPage={crmsQuery.isFetchingNextPage}
          hasNextPage={Boolean(crmsQuery.hasNextPage)}
          onLoadMore={() => void crmsQuery.fetchNextPage()}
          className="w-full"
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCrm ? 'Editar CRM' : 'Novo CRM'}
        description="Defina o nome, descrição e cor identificadora do funil."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Nome" htmlFor="crm-name" required error={errors.name?.message}>
            <input
              id="crm-name"
              type="text"
              placeholder="Ex.: Vendas B2B"
              className={inputClassName(Boolean(errors.name))}
              {...register('name')}
            />
          </FormField>

          <FormField label="Descrição" htmlFor="crm-desc" error={errors.description?.message}>
            <textarea
              id="crm-desc"
              rows={3}
              placeholder="Descreva o objetivo deste funil..."
              className={inputClassName(Boolean(errors.description))}
              {...register('description')}
            />
          </FormField>

          <FormField label="Cor identificadora" htmlFor="crm-color" error={errors.color?.message}>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setValue('color', hex, { shouldValidate: true })}
                    className={`h-7 w-7 rounded-md border transition-transform ${
                      selectedColor.toLowerCase() === hex
                        ? 'scale-110 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#17171a]'
                        : 'border-black/15'
                    }`}
                    style={{ backgroundColor: hex }}
                    aria-label={`Selecionar cor ${hex}`}
                  />
                ))}
              </div>
              <input
                id="crm-color"
                type="text"
                placeholder="#2563eb"
                className={`${inputClassName(Boolean(errors.color))} w-32 font-mono`}
                {...register('color')}
              />
            </div>
          </FormField>

          <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingCrm
                  ? 'Salvar alterações'
                  : 'Criar CRM'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingCrm)}
        onClose={() => setDeletingCrm(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir CRM"
        description={`Tem certeza que deseja excluir o CRM "${deletingCrm?.name ?? ''}"? Todas as etapas associadas serão afetadas.`}
        confirmLabel="Excluir CRM"
      />
    </div>
  );
}
