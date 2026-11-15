import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Check, Copy, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useCreateCrmMutation,
  useCrmsQuery,
  useDeleteCrmMutation,
  useUpdateCrmMutation,
} from './hooks';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { CardsGridSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { HEX_COLOR_REGEX } from '@/src/lib/format';
import type { Crm } from '@/src/lib/types';

const PRESET_COLORS = ['#2563eb', '#0d9488', '#d97706', '#dc2626', '#4f46e5', '#0f172a'];

const crmSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do pipeline'),
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
  const crmsQuery = useCrmsQuery();
  const createMutation = useCreateCrmMutation();
  const updateMutation = useUpdateCrmMutation();
  const deleteMutation = useDeleteCrmMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCrm, setEditingCrm] = useState<Crm | null>(null);
  const [deletingCrm, setDeletingCrm] = useState<Crm | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
        toast.success('Pipeline atualizado');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Pipeline criado');
      }
      setModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar pipeline', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deletingCrm) return;
    try {
      await deleteMutation.mutateAsync(deletingCrm.id);
      toast.success('Pipeline excluído');
      setDeletingCrm(null);
    } catch (error) {
      toast.error('Erro ao excluir pipeline', getApiErrorMessage(error));
    }
  };

  const copyToken = async (crm: Crm) => {
    try {
      await navigator.clipboard.writeText(crm.token);
      setCopiedId(crm.id);
      toast.success('Token copiado para a área de transferência');
      setTimeout(() => setCopiedId((prev) => (prev === crm.id ? null : prev)), 2000);
    } catch {
      toast.error('Não foi possível copiar o token');
    }
  };

  const crms = crmsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Pipelines (CRMs)
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gerencie seus funis de atendimento, tokens de integração e quadros Kanban.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Novo pipeline</span>
        </button>
      </div>

      {crmsQuery.isPending ? (
        <CardsGridSkeleton count={3} />
      ) : crmsQuery.isError ? (
        <ErrorState
          title="Erro ao carregar pipelines"
          error={crmsQuery.error}
          onRetry={() => void crmsQuery.refetch()}
        />
      ) : crms.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-5 w-5" />}
          title="Nenhum pipeline encontrado"
          description="Crie seu primeiro CRM para configurar etapas personalizadas e acompanhar seus leads."
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Criar primeiro pipeline</span>
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crms.map((crm) => (
            <article
              key={crm.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/10"
                      style={{ backgroundColor: crm.color || '#2563eb' }}
                      aria-hidden="true"
                    />
                    <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                      {crm.name}
                    </h2>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(crm)}
                      aria-label={`Editar ${crm.name}`}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCrm(crm)}
                      aria-label={`Excluir ${crm.name}`}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 min-h-[2.5rem] line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {crm.description || 'Sem descrição cadastrada.'}
                </p>

                <div className="mt-4">
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Token do CRM
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950">
                    <code className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                      {crm.token}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyToken(crm)}
                      className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label="Copiar token"
                    >
                      {copiedId === crm.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
                <Link
                  to={`/crms/${crm.id}/board`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <span>Abrir Kanban</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCrm ? 'Editar pipeline' : 'Novo pipeline'}
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
                        ? 'scale-110 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900'
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

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
                  : 'Criar pipeline'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingCrm)}
        onClose={() => setDeletingCrm(null)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir pipeline"
        description={`Tem certeza que deseja excluir o pipeline "${deletingCrm?.name ?? ''}"? Todas as etapas associadas serão afetadas.`}
        confirmLabel="Excluir pipeline"
      />
    </div>
  );
}
