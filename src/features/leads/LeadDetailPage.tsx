import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Megaphone, Trash2 } from 'lucide-react';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
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
  utm_device: z.string().trim().max(40, 'Máximo de 40 caracteres').optional(),
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
        utm_device: source?.utm_device ?? '',
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
          utm_device: values.utm_device?.trim() || null,
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
      <div className="w-full space-y-4">
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
      <div className="w-full space-y-4">
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
    <div className="w-full space-y-6">
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

        <Button variant="outlined" color="error" startIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
          Excluir lead
        </Button>
      </div>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <FormField label="Nome" htmlFor="lead-name" required error={errors.name?.message}>
            <TextInput
              id="lead-name"
              type="text"
              hasError={Boolean(errors.name)}
              {...register('name')}
            />
          </FormField>

          <FormField label="E-mail" htmlFor="lead-email" required error={errors.email?.message}>
            <TextInput
              id="lead-email"
              type="email"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField label="Telefone" htmlFor="lead-phone" error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <TextInput
                    id="lead-phone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    hasError={Boolean(errors.phone)}
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
            <TextInput
              id="lead-website"
              type="url"
              placeholder="https://empresa.com.br"
              hasError={Boolean(errors.website)}
              {...register('website')}
            />
          </FormField>

          <FormField label="Observações" htmlFor="lead-desc" error={errors.description?.message}>
            <TextArea
              id="lead-desc"
              hasError={Boolean(errors.description)}
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
                <TextInput
                  id="lead-utm-source"
                  type="text"
                  placeholder="google"
                  hasError={Boolean(errors.utm_source)} className="font-mono"
                  {...register('utm_source')}
                />
              </FormField>
              <FormField label="Medium (ex: cpc)" htmlFor="lead-utm-medium" error={errors.utm_medium?.message}>
                <TextInput
                  id="lead-utm-medium"
                  type="text"
                  placeholder="cpc"
                  hasError={Boolean(errors.utm_medium)} className="font-mono"
                  {...register('utm_medium')}
                />
              </FormField>
              <FormField label="Campaign" htmlFor="lead-utm-campaign" error={errors.utm_campaign?.message}>
                <TextInput
                  id="lead-utm-campaign"
                  type="text"
                  placeholder="lancamento-2026"
                  hasError={Boolean(errors.utm_campaign)} className="font-mono"
                  {...register('utm_campaign')}
                />
              </FormField>
              <FormField label="Term" htmlFor="lead-utm-term" error={errors.utm_term?.message}>
                <TextInput
                  id="lead-utm-term"
                  type="text"
                  placeholder="palavra-chave"
                  hasError={Boolean(errors.utm_term)} className="font-mono"
                  {...register('utm_term')}
                />
              </FormField>
              <FormField label="Content" htmlFor="lead-utm-content" error={errors.utm_content?.message}>
                <TextInput
                  id="lead-utm-content"
                  type="text"
                  placeholder="cta-azul"
                  hasError={Boolean(errors.utm_content)} className="font-mono"
                  {...register('utm_content')}
                />
              </FormField>
              <FormField label="Device" htmlFor="lead-utm-device" error={errors.utm_device?.message}>
                <TextInput
                  id="lead-utm-device"
                  type="text"
                  slotProps={{ htmlInput: { list: 'lead-utm-device-options' } }}
                  placeholder="mobile"
                  hasError={Boolean(errors.utm_device)} className="font-mono"
                  {...register('utm_device')}
                />
                <datalist id="lead-utm-device-options">
                  <option value="mobile" />
                  <option value="desktop" />
                  <option value="tablet" />
                </datalist>
              </FormField>
              <FormField label="Referrer" htmlFor="lead-referrer" error={errors.referrer?.message}>
                <TextInput
                  id="lead-referrer"
                  type="text"
                  placeholder="https://google.com"
                  hasError={Boolean(errors.referrer)} className="font-mono"
                  {...register('referrer')}
                />
              </FormField>
            </div>
            <FormField label="Landing page" htmlFor="lead-landing-page" error={errors.landing_page?.message}>
              <TextInput
                id="lead-landing-page"
                type="url"
                placeholder="https://site.com.br/lp"
                hasError={Boolean(errors.landing_page)} className="font-mono"
                {...register('landing_page')}
              />
            </FormField>
          </fieldset>

          <div className="flex justify-end border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
            <Button variant="contained" disabled={updateMutation.isPending || !isDirty} type="submit">
              {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
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
