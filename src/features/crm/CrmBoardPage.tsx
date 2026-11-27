import { TextInput } from '@/src/components/common/TextInput';
import ActionButton from '@/src/components/common/Button';
import { ModalActions } from '@/src/components/common/ModalActions';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, BarChart3, Columns3, History, Plug, Plus } from 'lucide-react';
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
import { Autocomplete, type AutocompleteOption } from '@/src/components/common/Autocomplete';
import { PageHeader } from '@/src/components/layout/PageHeader';
import { LostReasonPrompt } from '@/src/features/lost-reasons/LostReasonPrompt';

const stepSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da etapa'),
  description: z.string().optional(),
  kind: z.enum(['open', 'won', 'lost']),
});

type StepFormValues = z.infer<typeof stepSchema>;

const STEP_KIND_OPTIONS: AutocompleteOption[] = [
  { value: 'open', label: 'Em aberto', description: 'O lead continua negociando' },
  { value: 'won', label: 'Ganho', description: 'Fecha o negócio como vendido' },
  { value: 'lost', label: 'Perda', description: 'Fecha o negócio e pergunta o motivo' },
];

export function CrmBoardPage() {
  const { id } = useParams();
  const crmId = Number(id);
  const { toast } = useToast();

  const crmQuery = useCrmQuery(crmId);
  const stepsQuery = useStepsInfiniteQuery(crmId);

  const createStepMutation = useCreateStepMutation(crmId);
  const reorderStepsMutation = useReorderStepsMutation(crmId);
  const updateStepMutation = useUpdateStepMutation(crmId);
  const deleteStepMutation = useDeleteStepMutation(crmId);
  const moveLeadMutation = useMoveLeadStepMutation();

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [deletingStep, setDeletingStep] = useState<Step | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StepFormValues>({
    resolver: zodResolver(stepSchema),
    defaultValues: { name: '', description: '', kind: 'open' },
  });

  const steps = useMemo(
    () => [...(stepsQuery.items ?? [])].sort((a, b) => a.position - b.position || a.id - b.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepsQuery.items],
  );

  const openCreateStep = () => {
    setEditingStep(null);
    reset({ name: '', description: '', kind: 'open' });
    setStepModalOpen(true);
  };

  const openEditStep = (step: Step) => {
    setEditingStep(step);
    reset({
      name: step.name,
      description: step.description ?? '',
      kind: step.kind,
    });
    setStepModalOpen(true);
  };

  const onSubmitStep = async (values: StepFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      kind: values.kind,
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

  /*
    Mover para uma etapa de perda abre o seletor de motivo antes de concluir; o
    movimento fica pendente até a escolha. Perguntar depois é perguntar para
    quem já virou a página — e é o que deixava o gráfico de motivos vazio.
  */
  const [pendingLoss, setPendingLoss] = useState<{
    leadId: number;
    leadName: string;
    stepId: number;
    stepName: string;
    previousId: number | null;
    nextId: number | null;
  } | null>(null);

  const handleMoveLead = (
    leadId: number,
    targetStepId: number,
    options: { previousId: number | null; nextId: number | null; leadName?: string },
  ) => {
    const target = steps.find((step) => step.id === targetStepId);

    if (target?.kind === 'lost') {
      setPendingLoss({
        leadId,
        leadName: options.leadName ?? 'Este lead',
        stepId: targetStepId,
        stepName: target.name,
        previousId: options.previousId,
        nextId: options.nextId,
      });

      return;
    }

    moveLeadMutation.mutate({
      leadId,
      stepId: targetStepId,
      previousId: options.previousId,
      nextId: options.nextId,
    });
  };

  const confirmLoss = (lostReasonId: number) => {
    if (!pendingLoss) {
      return;
    }

    moveLeadMutation.mutate(
      {
        leadId: pendingLoss.leadId,
        stepId: pendingLoss.stepId,
        previousId: pendingLoss.previousId,
        nextId: pendingLoss.nextId,
        lostReasonId,
      },
      { onSettled: () => setPendingLoss(null) },
    );
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
          <span>Voltar para CRMs</span>
        </Link>
        <ErrorState
          title="CRM não encontrado"
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
      <PageHeader
        trail={[{ to: '/crms', label: 'Todos os CRMs' }]}
        icon={
          <span
            className="h-3.5 w-3.5 rounded-sm border border-black/10"
            style={{ backgroundColor: crm.color || '#2563eb' }}
          />
        }
        title={crm.name}
        description={crm.description || undefined}
        actions={
          <>
            <Link
              to={`/crms/${crmId}/dashboard`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap shrink-0 sm:w-auto dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
            >
              <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
              <span>Dashboard</span>
            </Link>

            <Link
              to={`/crms/${crmId}/audit`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap shrink-0 sm:w-auto dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
            >
              <History className="h-4 w-4" strokeWidth={1.8} />
              <span>Auditoria</span>
            </Link>

            <Link
              to={`/crms/${crmId}/integration`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900 whitespace-nowrap shrink-0 sm:w-auto dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100"
            >
              <Plug className="h-4 w-4" strokeWidth={1.8} />
              <span>Integração pública</span>
            </Link>

            <ActionButton
              type="button"
              onClick={openCreateStep}
              className="whitespace-nowrap shrink-0"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              startIcon={<Plus className="h-4 w-4" />}
            >
              Nova etapa
            </ActionButton>
          </>
        }
      />

      {/* Board */}
      {steps.length === 0 ? (
        <EmptyState
          icon={<Columns3 className="h-5 w-5" />}
          title="Nenhuma etapa configurada"
          description="Adicione as etapas do seu funil (ex.: Novo Lead, Qualificação, Proposta) para começar a organizar leads."
          action={
            <ActionButton
              type="button"
              onClick={openCreateStep}
              startIcon={<Plus className="h-4 w-4" />}
            >
              Criar primeira etapa
            </ActionButton>
          }
        />
      ) : (
        <div className="space-y-3">
          <KanbanBoard
            steps={steps}
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
      <LostReasonPrompt
        open={pendingLoss !== null}
        leadName={pendingLoss?.leadName ?? ''}
        stepName={pendingLoss?.stepName ?? ''}
        isPending={moveLeadMutation.isPending}
        // Cancelar não move nada: o card volta para onde estava.
        onCancel={() => setPendingLoss(null)}
        onConfirm={confirmLoss}
      />

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

          {/*
            Sem nenhuma etapa marcada como ganho ou perda, o lead nunca é
            fechado: taxa de conversão, receita, ciclo de venda e motivos de
            perda ficam todos vazios no funil. É o campo mais importante desta
            modal e o menos óbvio, por isso a explicação fica à vista.
          */}
          <FormField label="Tipo de etapa" htmlFor="step-kind" error={errors.kind?.message}>
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Autocomplete
                  id="step-kind"
                  value={field.value}
                  onChange={(value) => field.onChange(value || 'open')}
                  options={STEP_KIND_OPTIONS}
                  placeholder="Em aberto"
                />
              )}
            />
          </FormField>

          <p className="rounded-lg border border-zinc-950/[0.07] bg-zinc-50 px-3.5 py-2 text-xs text-zinc-500 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            A ordem das etapas é definida arrastando-as no quadro Kanban — sem campo de posição.
          </p>

          <ModalActions
            onCancel={() => setStepModalOpen(false)}
            isPending={createStepMutation.isPending || updateStepMutation.isPending}
            submitLabel={editingStep ? 'Salvar etapa' : 'Criar etapa'}
          />
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
