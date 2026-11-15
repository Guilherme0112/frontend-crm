import { useState, type DragEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Lead, Step } from '@/src/lib/types';
import { cn } from '@/src/lib/cn';
import { PHONE_REGEX, maskPhone } from '@/src/lib/format';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { useCreateLeadMutation } from '@/src/features/leads/hooks';
import { useToast } from '@/src/components/common/Toast';
import { KanbanCard } from './KanbanCard';

const inlineLeadSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Formato (00) 00000-0000',
    }),
});

type InlineLeadValues = z.infer<typeof inlineLeadSchema>;

interface KanbanColumnProps {
  step: Step;
  leads: Lead[];
  draggingLeadId: number | null;
  onDragStart: (e: DragEvent<HTMLDivElement>, leadId: number) => void;
  onDragEnd: () => void;
  onDropLead: (leadId: number, targetStepId: number) => void;
  onSelectLead: (leadId: number) => void;
  onEditStep: (step: Step) => void;
  onDeleteStep: (step: Step) => void;
}

export function KanbanColumn({
  step,
  leads,
  draggingLeadId,
  onDragStart,
  onDragEnd,
  onDropLead,
  onSelectLead,
  onEditStep,
  onDeleteStep,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const createLeadMutation = useCreateLeadMutation();
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InlineLeadValues>({
    resolver: zodResolver(inlineLeadSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const raw = e.dataTransfer.getData('text/plain');
    const leadId = Number(raw);
    if (Number.isFinite(leadId) && leadId > 0) {
      onDropLead(leadId, step.id);
    }
  };

  const onCreateInlineLead = async (values: InlineLeadValues) => {
    try {
      await createLeadMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        step_id: step.id,
      });
      toast.success('Lead adicionado à etapa');
      reset();
      setIsAdding(false);
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao criar lead', getApiErrorMessage(error));
    }
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-label={`Etapa ${step.name}`}
      className={cn(
        'flex w-80 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-100/75 transition-colors dark:border-slate-800 dark:bg-slate-900/60',
        isDragOver &&
          'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-950/30',
      )}
    >
      {/* Column Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-3.5 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {step.name}
            </h3>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {leads.length}
            </span>
          </div>
          {step.description && (
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {step.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEditStep(step)}
            title="Editar etapa"
            aria-label={`Editar etapa ${step.name}`}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteStep(step)}
            title="Excluir etapa"
            aria-label={`Excluir etapa ${step.name}`}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Cards list */}
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            isDragging={draggingLeadId === lead.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onSelect={onSelectLead}
          />
        ))}

        {leads.length === 0 && !isAdding && (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Arraste um lead para cá ou adicione abaixo
          </div>
        )}

        {/* Inline add lead */}
        {isAdding ? (
          <form
            onSubmit={handleSubmit(onCreateInlineLead)}
            className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            noValidate
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Novo lead
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  reset();
                }}
                className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Cancelar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Nome do lead *"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('name')}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="email"
                placeholder="E-mail *"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <input
                    type="tel"
                    placeholder="Telefone (opcional)"
                    className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.phone && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  reset();
                }}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createLeadMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-transparent py-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Adicionar lead</span>
          </button>
        )}
      </div>
    </section>
  );
}
