import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Drawer } from '@/src/components/common/Drawer';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { PHONE_REGEX, formatDateTime, maskPhone } from '@/src/lib/format';
import type { Step } from '@/src/lib/types';
import { useDeleteLeadMutation, useLeadQuery, useUpdateLeadMutation } from './hooks';

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do lead'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Use o formato (00) 00000-0000',
    }),
  website: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Informe uma URL iniciando com http:// ou https://',
    }),
  step_id: z
    .number({ message: 'Selecione uma etapa' })
    .int()
    .min(1, 'Selecione uma etapa'),
  description: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadDrawerProps {
  leadId: number | null;
  steps: Step[];
  onClose: () => void;
}

export function LeadDrawer({ leadId, steps, onClose }: LeadDrawerProps) {
  const { toast } = useToast();
  const leadQuery = useLeadQuery(leadId);
  const updateMutation = useUpdateLeadMutation();
  const deleteMutation = useDeleteLeadMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      website: '',
      step_id: steps[0]?.id ?? 1,
      description: '',
    },
  });

  useEffect(() => {
    if (leadQuery.data) {
      reset({
        name: leadQuery.data.name,
        email: leadQuery.data.email,
        phone: leadQuery.data.phone ?? '',
        website: leadQuery.data.website ?? '',
        step_id: leadQuery.data.step_id,
        description: leadQuery.data.description ?? '',
      });
    }
  }, [leadQuery.data, reset]);

  const onSubmit = async (values: LeadFormValues) => {
    if (!leadId) return;
    try {
      await updateMutation.mutateAsync({
        id: leadId,
        payload: {
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone?.trim() || null,
          website: values.website?.trim() || null,
          step_id: values.step_id,
          description: values.description?.trim() || null,
        },
      });
      toast.success('Lead atualizado');
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao atualizar lead', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!leadId) return;
    try {
      await deleteMutation.mutateAsync(leadId);
      toast.success('Lead removido');
      setConfirmOpen(false);
      onClose();
    } catch (error) {
      toast.error('Erro ao remover lead', getApiErrorMessage(error));
    }
  };

  return (
    <>
      <Drawer
        open={Boolean(leadId)}
        onClose={onClose}
        title={leadQuery.data?.name || 'Detalhes do Lead'}
        subtitle={leadQuery.data ? `Lead #${leadQuery.data.id}` : undefined}
      >
        {leadQuery.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : leadQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar o lead"
            error={leadQuery.error}
            onRetry={() => void leadQuery.refetch()}
          />
        ) : leadQuery.data ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>Criado em {formatDateTime(leadQuery.data.created_at)}</span>
              <Link
                to={`/leads/${leadQuery.data.id}`}
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Abrir página</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Nome" htmlFor="drawer-lead-name" required error={errors.name?.message}>
                <input
                  id="drawer-lead-name"
                  type="text"
                  className={inputClassName(Boolean(errors.name))}
                  {...register('name')}
                />
              </FormField>

              <FormField label="E-mail" htmlFor="drawer-lead-email" required error={errors.email?.message}>
                <input
                  id="drawer-lead-email"
                  type="email"
                  className={inputClassName(Boolean(errors.email))}
                  {...register('email')}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Telefone" htmlFor="drawer-lead-phone" error={errors.phone?.message}>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <input
                        id="drawer-lead-phone"
                        type="tel"
                        placeholder="(11) 98765-4321"
                        className={inputClassName(Boolean(errors.phone))}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>

                <FormField label="Etapa" htmlFor="drawer-lead-step" required error={errors.step_id?.message}>
                  <select
                    id="drawer-lead-step"
                    className={inputClassName(Boolean(errors.step_id))}
                    {...register('step_id', { valueAsNumber: true })}
                  >
                    {steps.map((step) => (
                      <option key={step.id} value={step.id}>
                        {step.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Site" htmlFor="drawer-lead-website" error={errors.website?.message}>
                <input
                  id="drawer-lead-website"
                  type="url"
                  placeholder="https://empresa.com.br"
                  className={inputClassName(Boolean(errors.website))}
                  {...register('website')}
                />
              </FormField>

              <FormField label="Observações" htmlFor="drawer-lead-description" error={errors.description?.message}>
                <textarea
                  id="drawer-lead-description"
                  rows={4}
                  className={inputClassName(Boolean(errors.description))}
                  {...register('description')}
                />
              </FormField>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending || !isDirty}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir lead"
        description={`Tem certeza que deseja excluir o lead "${leadQuery.data?.name ?? ''}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir lead"
      />
    </>
  );
}
