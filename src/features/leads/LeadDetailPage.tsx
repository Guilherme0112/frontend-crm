import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { PHONE_REGEX, formatDateTime, maskPhone } from '@/src/lib/format';
import { useDeleteLeadMutation, useLeadQuery, useUpdateLeadMutation } from './hooks';

const leadDetailSchema = z.object({
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
    .number({ message: 'Informe o ID da etapa' })
    .int()
    .min(1, 'Informe o ID da etapa'),
  description: z.string().optional(),
});

type LeadDetailFormValues = z.infer<typeof leadDetailSchema>;

export function LeadDetailPage() {
  const { id } = useParams();
  const leadId = Number(id);
  const navigate = useNavigate();
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
  } = useForm<LeadDetailFormValues>({
    resolver: zodResolver(leadDetailSchema),
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

  const onSubmit = async (values: LeadDetailFormValues) => {
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
      toast.success('Lead atualizado com sucesso');
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao salvar lead', getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(leadId);
      toast.success('Lead excluído');
      setConfirmOpen(false);
      navigate('/crms', { replace: true });
    } catch (error) {
      toast.error('Erro ao excluir lead', getApiErrorMessage(error));
    }
  };

  if (leadQuery.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (leadQuery.isError || !leadQuery.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          to="/crms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para pipelines</span>
        </Link>
        <ErrorState
          title="Lead não encontrado"
          error={leadQuery.error}
          onRetry={() => void leadQuery.refetch()}
        />
      </div>
    );
  }

  const lead = leadQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/crms"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para pipelines</span>
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {lead.name}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Lead #{lead.id} · Criado em {formatDateTime(lead.created_at)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-4 w-4" />
          <span>Excluir lead</span>
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Nome" htmlFor="lead-name" required error={errors.name?.message}>
            <input
              id="lead-name"
              type="text"
              className={inputClassName(Boolean(errors.name))}
              {...register('name')}
            />
          </FormField>

          <FormField label="E-mail" htmlFor="lead-email" required error={errors.email?.message}>
            <input
              id="lead-email"
              type="email"
              className={inputClassName(Boolean(errors.email))}
              {...register('email')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Telefone" htmlFor="lead-phone" error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <input
                    id="lead-phone"
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

            <FormField label="ID da etapa" htmlFor="lead-step" required error={errors.step_id?.message}>
              <input
                id="lead-step"
                type="number"
                min={1}
                className={inputClassName(Boolean(errors.step_id))}
                {...register('step_id', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField label="Site" htmlFor="lead-website" error={errors.website?.message}>
            <input
              id="lead-website"
              type="url"
              placeholder="https://empresa.com.br"
              className={inputClassName(Boolean(errors.website))}
              {...register('website')}
            />
          </FormField>

          <FormField label="Observações" htmlFor="lead-desc" error={errors.description?.message}>
            <textarea
              id="lead-desc"
              rows={4}
              className={inputClassName(Boolean(errors.description))}
              {...register('description')}
            />
          </FormField>

          <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        isPending={deleteMutation.isPending}
        title="Excluir lead"
        description={`Deseja excluir permanentemente o lead "${lead.name}"?`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
