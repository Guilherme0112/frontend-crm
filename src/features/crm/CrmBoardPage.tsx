import Button from '@mui/material/Button';
import { TextInput } from '@/src/components/common/TextInput';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, BarChart3, Columns3, History, Plug, Plus, Search } from 'lucide-react';
import {
  useCreateStepMutation,
  useCrmQuery,
  useDeleteStepMutation,
  useReorderStepsMutation,
  useStepsInfiniteQuery,
  useUpdateStepMutation,
} from './hooks';
import { useMoveLeadStepMutation } from '@/src/features/leads/hooks';
import { KanbanBoard } from '@/src/components/kanban/KanbanBoard';
import { LeadDrawer } from '@/src/features/leads/LeadDrawer';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField } from '@/src/components/common/FormField';
import { Skeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import type { Step } from '@/src/lib/types';

const stepSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da etapa'),
  description: z.string().optional(),
});

type StepFormValues = z.infer<typeof stepSchema>;

export function CrmBoardPage() {
  const { id } = useParams();
  const crmId = Number(id);
  const { toast } = useToast();

  const crmQuery = useCrmQuery(crmId);
  const stepsQuery = useStepsInfiniteQuery(crmId, 5);

  const createStepMutation = useCreateStepMutation(crmId);
  const reorderStepsMutation = useReorderStepsMutation(crmId);
  const updateStepMutation = useUpdateStepMutation(crmId);
  const deleteStepMutation = useDeleteStepMutation(crmId);
  const moveLeadMutation = useMoveLeadStepMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [deletingStep, setDeletingStep] = useState<Step | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: { name: '', description: '' },
  });

  const steps = useMemo(
    () => [...(stepsQuery.items ?? [])].sort((a, b) => a.position - b.position || a.id - b.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepsQuery.items],
  );

  const openCreateStep = () => {
    setEditingStep(null);
    reset({ name: '', description: '' });
    setStepModalOpen(true);
  };

  const openEditStep = (step: Step) => {
    setEditingStep(step);
    reset({
      name: step.name,
      description: step.description ?? '',
    });
    setStepModalOpen(true);
  };

  const onSubmitStep = async (values: StepFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
    };
    try {
      if (editingStep) {
        await updateStepMutation.mutateAsync({ stepId: editingStep.id, payload });
        toast.success('Etapa atualizada');
      } else {
        await createStepMutation.mutateAsync(payload);
        toast.success('Etapa criada');
      }
      setStepModalOpen(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar etapa', getApiErrorMessage(error));
    }
  };

  const handleDeleteStep = async () => {
    if (!deletingStep) return;
    try {
      await deleteStepMutation.mutateAsync(deletingStep.id);
      toast.success('Etapa excluída');
      setDeletingStep(null);
    } catch (error) {
      toast.error('Erro ao excluir etapa', getApiErrorMessage(error));
    }
  };

  const handleMoveLead = (
    leadId: number,
    targetStepId: number,
    options: { previousId: number | null; nextId: number | null },
  ) => {
    moveLeadMutation.mutate({
      leadId,
      stepId: targetStepId,
      previousId: options.previousId,
      nextId: options.nextId,
    });
  };

  if (crmQuery.isPending || stepsQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-4 overflow-x-auto">
          <Skeleton className="h-96 w-80 shrink-0 rounded-xl" />
          <Skeleton className="h-96 w-80 shrink-0 rounded-xl" />
          <Skeleton className="h-96 w-80 shrink-0 rounded-xl" />
        </div>
      </div>
    );
  }

  if (crmQuery.isError || !crmQuery.data) {
    return (
      <div className="space-y-4">
        <Link
          to="/crms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para pipelines</span>
        </Link>
        <ErrorState
          title="Pipeline não encontrado"
          error={crmQuery.error}
          onRetry={() => void crmQuery.refetch()}
        />
      </div>
    );
  }

  if (stepsQuery.isError) {
    return (
      <ErrorState
        title="Erro ao carregar quadro Kanban"
        error={stepsQuery.error}
        onRetry={() => void stepsQuery.refetch()}
      />
    );
  }

  const crm = crmQuery.data;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to="/crms"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Todos os pipelines</span>
          </Link>
          <div className="mt-1.5 flex items-center gap-2.5">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm border border-black/10"
              style={{ backgroundColor: crm.color || '#2563eb' }}
              aria-hidden="true"
            />
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {crm.name}
            </h1>
          </div>
          {crm.description && (
            <p className="mt-1 max-w-md break-words text-sm text-zinc-600 line-clamp-2 dark:text-zinc-400">
              {crm.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <TextInput
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou e-mail..."
              aria-label="Filtrar leads por nome ou e-mail"
              className="w-full rounded-lg border border-zinc-950/[0.12] bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </div>

          <Link
            to={`/crms/${crmId}/dashboard`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap shrink-0 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            <span>Dashboard</span>
          </Link>

          <Link
            to={`/crms/${crmId}/audit`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap shrink-0 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
          >
            <History className="h-4 w-4" strokeWidth={1.8} />
            <span>Auditoria</span>
          </Link>

          <Link
            to={`/crms/${crmId}/integration`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap shrink-0 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
          >
            <Plug className="h-4 w-4" strokeWidth={1.8} />
            <span>Integração pública</span>
          </Link>

          <Button
            type="button"
            onClick={openCreateStep}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Nova etapa</span>
          </Button>
        </div>
      </div>

      {/* Board */}
      {steps.length === 0 ? (
        <EmptyState
          icon={<Columns3 className="h-5 w-5" />}
          title="Nenhuma etapa configurada"
          description="Adicione as etapas do seu funil (ex.: Novo Lead, Qualificação, Proposta) para começar a organizar leads."
          action={
            <Button
              type="button"
              onClick={openCreateStep}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Criar primeira etapa</span>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <KanbanBoard
            steps={steps}
            searchQuery={searchQuery}
            hasMore={Boolean(stepsQuery.hasNextPage)}
            isFetchingNextPage={stepsQuery.isFetchingNextPage}
            onLoadMore={() => void stepsQuery.fetchNextPage()}
            onMoveLead={handleMoveLead}
            onSelectLead={(leadId) => setSelectedLeadId(leadId)}
            onEditStep={openEditStep}
            onDeleteStep={(step) => setDeletingStep(step)}
            onReorderSteps={(orderedIds) => reorderStepsMutation.mutate(orderedIds)}
            reorderDisabled={Boolean(stepsQuery.hasNextPage)}
          />
        </div>
      )}

      {/* Step Create/Edit Modal */}
      <Modal
        open={stepModalOpen}
        onClose={() => setStepModalOpen(false)}
        title={editingStep ? 'Editar etapa' : 'Nova etapa'}
        description="As colunas do Kanban são ordenadas pelo campo posição."
      >
        <form onSubmit={handleSubmit(onSubmitStep)} className="space-y-4" noValidate>
          <FormField label="Nome da etapa" htmlFor="step-name" required error={errors.name?.message}>
            <TextInput
              id="step-name"
              type="text"
              placeholder="Ex.: Qualificação"
              {...register('name')}
            />
          </FormField>

          <FormField label="Descrição" htmlFor="step-desc" error={errors.description?.message}>
            <TextInput
              id="step-desc"
              type="text"
              placeholder="Opcional"
              {...register('description')}
            />
          </FormField>

          <p className="rounded-lg border border-zinc-950/[0.07] bg-zinc-50 px-3.5 py-2 text-xs text-zinc-500 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            A ordem das etapas é definida arrastando-as no quadro Kanban — sem campo de posição.
          </p>

          <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
            <Button
              type="button"
              onClick={() => setStepModalOpen(false)}
              className="rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createStepMutation.isPending || updateStepMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createStepMutation.isPending || updateStepMutation.isPending
                ? 'Salvando...'
                : editingStep
                  ? 'Salvar etapa'
                  : 'Criar etapa'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingStep)}
        onClose={() => setDeletingStep(null)}
        onConfirm={() => void handleDeleteStep()}
        isPending={deleteStepMutation.isPending}
        title="Excluir etapa"
        description={`Tem certeza que deseja excluir a etapa "${deletingStep?.name ?? ''}"?`}
        confirmLabel="Excluir etapa"
      />

      <LeadDrawer
        leadId={selectedLeadId}
        steps={steps}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
