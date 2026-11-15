import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Megaphone, Trash2 } from 'lucide-react';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { PHONE_REGEX, formatDateTime, maskPhone } from '@/src/lib/format';
import {
  useDeleteLeadMutation,
  useLeadQuery,
  useLeadSourceQuery,
  useUpdateLeadMutation,
} from './hooks';
import { useStepsQuery } from '@/src/features/crm/hooks';
import { Autocomplete } from '@/src/components/common/Autocomplete';

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
    .number({ message: 'Selecione uma etapa' })
    .int()
    .min(1, 'Selecione uma etapa'),
  description: z.string().optional(),
  utm_source: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  utm_medium: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  utm_campaign: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  utm_term: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  utm_content: z.string().trim().max(255, 'Máximo de 255 caracteres').optional(),
  referrer: z.string().trim().max(512, 'Máximo de 512 caracteres').optional(),
  landing_page: z.string().trim().max(512, 'Máximo de 512 caracteres').optional(),
});

type LeadDetailFormValues = z.infer<typeof leadDetailSchema>;

export function LeadDetailPage() {
  const { id } = useParams();
  const leadId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const leadQuery = useLeadQuery(leadId);
  const leadSourceQuery = useLeadSourceQuery(leadId);
  const updateMutation = useUpdateLeadMutation();
  const deleteMutation = useDeleteLeadMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const stepsQuery = useStepsQuery(
    leadQuery.data?.crm_id ?? 0,
    Boolean(leadQuery.data?.crm_id),
  );

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
      const source = leadSourceQuery.data;
      reset({
        name: leadQuery.data.name,
        email: leadQuery.data.email,
        phone: leadQuery.data.phone ?? '',
        website: leadQuery.data.website ?? '',
        step_id: leadQuery.data.step_id,
        description: leadQuery.data.description ?? '',
        utm_source: source?.utm_source ?? '',
        utm_medium: source?.utm_medium ?? '',
        utm_campaign: source?.utm_campaign ?? '',
        utm_term: source?.utm_term ?? '',
        utm_content: source?.utm_content ?? '',
        referrer: source?.referrer ?? '',
        landing_page: source?.landing_page ?? '',
      });
    }
  }, [leadQuery.data, leadSourceQuery.data, reset]);

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
          utm_source: values.utm_source?.trim() || null,
          utm_medium: values.utm_medium?.trim() || null,
          utm_campaign: values.utm_campaign?.trim() || null,
          utm_term: values.utm_term?.trim() || null,
          utm_content: values.utm_content?.trim() || null,
          referrer: values.referrer?.trim() || null,
          landing_page: values.landing_page?.trim() || null,
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
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para CRMs</span>
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para CRMs</span>
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {lead.name}
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {[
              lead.step_name ? `Etapa: ${lead.step_name}` : null,
              `Criado em ${formatDateTime(lead.created_at)}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-[#17171a] dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-4 w-4" />
          <span>Excluir lead</span>
        </button>
      </div>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
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

            <FormField label="Etapa" htmlFor="lead-step" required error={errors.step_id?.message}>
              <Controller
                name="step_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    id="lead-step"
                    value={field.value > 0 ? String(field.value) : ''}
                    onChange={(v) => field.onChange(v === '' ? 0 : Number(v))}
                    placeholder="Selecione uma etapa..."
                    emptyMessage="Nenhuma etapa encontrada"
                    hasError={Boolean(errors.step_id)}
                    options={stepsQuery.items.map((step) => ({ value: String(step.id), label: step.name }))}
                  />
                )}
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

          <fieldset className="space-y-3 rounded-xl border border-zinc-950/[0.07] p-4 dark:border-white/[0.07]">
            <legend className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              <Megaphone className="h-3.5 w-3.5" strokeWidth={1.8} />
              Origem (UTM)
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Source (ex: google)" htmlFor="lead-utm-source" error={errors.utm_source?.message}>
                <input
                  id="lead-utm-source"
                  type="text"
                  placeholder="google"
                  className={`${inputClassName(Boolean(errors.utm_source))} font-mono`}
                  {...register('utm_source')}
                />
              </FormField>
              <FormField label="Medium (ex: cpc)" htmlFor="lead-utm-medium" error={errors.utm_medium?.message}>
                <input
                  id="lead-utm-medium"
                  type="text"
                  placeholder="cpc"
                  className={`${inputClassName(Boolean(errors.utm_medium))} font-mono`}
                  {...register('utm_medium')}
                />
              </FormField>
              <FormField label="Campaign" htmlFor="lead-utm-campaign" error={errors.utm_campaign?.message}>
                <input
                  id="lead-utm-campaign"
                  type="text"
                  placeholder="lancamento-2026"
                  className={`${inputClassName(Boolean(errors.utm_campaign))} font-mono`}
                  {...register('utm_campaign')}
                />
              </FormField>
              <FormField label="Term" htmlFor="lead-utm-term" error={errors.utm_term?.message}>
                <input
                  id="lead-utm-term"
                  type="text"
                  placeholder="palavra-chave"
                  className={`${inputClassName(Boolean(errors.utm_term))} font-mono`}
                  {...register('utm_term')}
                />
              </FormField>
              <FormField label="Content" htmlFor="lead-utm-content" error={errors.utm_content?.message}>
                <input
                  id="lead-utm-content"
                  type="text"
                  placeholder="cta-azul"
                  className={`${inputClassName(Boolean(errors.utm_content))} font-mono`}
                  {...register('utm_content')}
                />
              </FormField>
              <FormField label="Referrer" htmlFor="lead-referrer" error={errors.referrer?.message}>
                <input
                  id="lead-referrer"
                  type="text"
                  placeholder="https://google.com"
                  className={`${inputClassName(Boolean(errors.referrer))} font-mono`}
                  {...register('referrer')}
                />
              </FormField>
            </div>
            <FormField label="Landing page" htmlFor="lead-landing-page" error={errors.landing_page?.message}>
              <input
                id="lead-landing-page"
                type="url"
                placeholder="https://site.com.br/lp"
                className={`${inputClassName(Boolean(errors.landing_page))} font-mono`}
                {...register('landing_page')}
              />
            </FormField>
          </fieldset>

          <div className="flex justify-end border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
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
