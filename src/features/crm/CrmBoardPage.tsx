import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Columns3, Plus, Search } from 'lucide-react';
import {
  useCreateStepMutation,
  useCrmQuery,
  useDeleteStepMutation,
  useStepsQuery,
  useUpdateStepMutation,
} from './hooks';
import { useLeadsQuery, useMoveLeadStepMutation } from '@/src/features/leads/hooks';
import { KanbanBoard } from '@/src/components/kanban/KanbanBoard';
import { LeadDrawer } from '@/src/features/leads/LeadDrawer';
import { Modal } from '@/src/components/common/Modal';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { Skeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import type { Step } from '@/src/lib/types';

const stepSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da etapa'),
  description: z.string().optional(),
  position: z
    .number({ message: 'Informe um número válido' })
    .int()
    .min(0, 'Posição deve ser maior ou igual a 0'),
});

type StepFormValues = z.infer<typeof stepSchema>;

export function CrmBoardPage() {
  const { id } = useParams();
  const crmId = Number(id);
  const { toast } = useToast();

  const crmQuery = useCrmQuery(crmId);
  const stepsQuery = useStepsQuery(crmId);
  const leadsQuery = useLeadsQuery();

  const createStepMutation = useCreateStepMutation(crmId);
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
    defaultValues: { name: '', description: '', position: 0 },
  });

  const steps = stepsQuery.data ?? [];
  const stepIds = useMemo(() => new Set(steps.map((s) => s.id)), [steps]);

  const filteredLeads = useMemo(() => {
    const allLeads = leadsQuery.data ?? [];
    const term = searchQuery.trim().toLowerCase();
    return allLeads.filter((lead) => {
      if (!stepIds.has(lead.step_id)) return false;
      if (!term) return true;
      return (
        lead.name.toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term)
      );
    });
  }, [leadsQuery.data, searchQuery, stepIds]);

  const openCreateStep = () => {
    setEditingStep(null);
    const nextPos = steps.length > 0 ? Math.max(...steps.map((s) => s.position)) + 1 : 0;
    reset({ name: '', description: '', position: nextPos });
    setStepModalOpen(true);
  };

  const openEditStep = (step: Step) => {
    setEditingStep(step);
    reset({
      name: step.name,
      description: step.description ?? '',
      position: step.position,
    });
    setStepModalOpen(true);
  };

  const onSubmitStep = async (values: StepFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      position: values.position,
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

  const handleMoveLead = (leadId: number, targetStepId: number) => {
    moveLeadMutation.mutate({ leadId, stepId: targetStepId });
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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

  if (stepsQuery.isError || leadsQuery.isError) {
    return (
      <ErrorState
        title="Erro ao carregar quadro Kanban"
        error={stepsQuery.error || leadsQuery.error}
        onRetry={() => {
          void stepsQuery.refetch();
          void leadsQuery.refetch();
        }}
      />
    );
  }

  const crm = crmQuery.data;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/crms"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {crm.name}
            </h1>
          </div>
          {crm.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {crm.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome ou e-mail..."
              aria-label="Filtrar leads por nome ou e-mail"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={openCreateStep}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            <span>Nova etapa</span>
          </button>
        </div>
      </div>

      {/* Board */}
      {steps.length === 0 ? (
        <EmptyState
          icon={<Columns3 className="h-5 w-5" />}
          title="Nenhuma etapa configurada"
          description="Adicione as etapas do seu funil (ex.: Novo Lead, Qualificação, Proposta) para começar a organizar leads."
          action={
            <button
              type="button"
              onClick={openCreateStep}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Criar primeira etapa</span>
            </button>
          }
        />
      ) : (
        <KanbanBoard
          steps={steps}
          leads={filteredLeads}
          onMoveLead={handleMoveLead}
          onSelectLead={(leadId) => setSelectedLeadId(leadId)}
          onEditStep={openEditStep}
          onDeleteStep={(step) => setDeletingStep(step)}
        />
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
            <input
              id="step-name"
              type="text"
              placeholder="Ex.: Qualificação"
              className={inputClassName(Boolean(errors.name))}
              {...register('name')}
            />
          </FormField>

          <FormField label="Descrição" htmlFor="step-desc" error={errors.description?.message}>
            <input
              id="step-desc"
              type="text"
              placeholder="Opcional"
              className={inputClassName(Boolean(errors.description))}
              {...register('description')}
            />
          </FormField>

          <FormField
            label="Posição"
            htmlFor="step-position"
            hint="Número inteiro (0, 1, 2...)"
            error={errors.position?.message}
          >
            <input
              id="step-position"
              type="number"
              min={0}
              className={`${inputClassName(Boolean(errors.position))} w-32 font-mono tabular-nums`}
              {...register('position', { valueAsNumber: true })}
            />
          </FormField>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStepModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createStepMutation.isPending || updateStepMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createStepMutation.isPending || updateStepMutation.isPending
                ? 'Salvando...'
                : editingStep
                  ? 'Salvar etapa'
                  : 'Criar etapa'}
            </button>
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
