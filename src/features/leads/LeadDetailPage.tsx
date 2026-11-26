import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CalendarDays, History, MapPin, Megaphone, Plus, Trash2 } from 'lucide-react';
import { FormField } from '@/src/components/common/FormField';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import {
  PHONE_MAX_LENGTH,
  PHONE_REGEX,
  currencyToCents,
  formatDateTime,
  maskCurrency,
  maskPhone,
  maskZipCode,
} from '@/src/lib/format';
import {
  addressSchema,
  addressToFormValues,
  addressToPayload,
  emptyAddressValues,
} from '@/src/lib/address';
import {
  useDeleteLeadMutation,
  useLeadQuery,
  useLeadSourceQuery,
  useUpdateLeadMutation,
} from './hooks';
import { useStepsQuery } from '@/src/features/crm/hooks';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { StatusIndicator } from '@/src/components/common/StatusBadge';
import { AgendaEventDrawer } from '@/src/features/agenda/AgendaEventDrawer';
import { AGENDA_STATUS_META, AGENDA_TYPE_LABEL } from '@/src/features/agenda/constants';
import { addDays, toIsoUtc } from '@/src/features/agenda/dates';
import { useAgendaEventsQuery } from '@/src/features/agenda/hooks';

const leadDetailSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do lead'),
  email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message: 'Use o formato +55 (00) 00000-0000',
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
  value: z.string().optional(),
  description: z.string().optional(),
  address: addressSchema,
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
  const [agendaDrawerOpen, setAgendaDrawerOpen] = useState(false);
  const stepsQuery = useStepsQuery(
    leadQuery.data?.crm_id ?? 0,
    Boolean(leadQuery.data?.crm_id),
  );
  const agendaParams = useMemo(() => {
    const now = new Date();
    return {
      from: toIsoUtc(now),
      to: toIsoUtc(addDays(now, 30)),
      lead_id: leadId,
      page: 1,
      per_page: 10,
    };
  }, [leadId]);
  const agendaQuery = useAgendaEventsQuery(agendaParams);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<LeadDetailFormValues>({
    resolver: zodResolver(leadDetailSchema),
    defaultValues: { address: emptyAddressValues },
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
        value:
          leadQuery.data.value_cents !== null && leadQuery.data.value_cents !== undefined
            ? maskCurrency(String(leadQuery.data.value_cents))
            : '',
        description: leadQuery.data.description ?? '',
        address: addressToFormValues(leadQuery.data.address),
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
          value_cents: currencyToCents(values.value ?? ''),
          description: values.description?.trim() || null,
          address: addressToPayload(values.address),
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
    <div className="mx-auto max-w-2xl space-y-8">
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            component={Link}
            to={`/leads/${lead.id}/history`}
            variant="outlined"
            size="small"
            startIcon={<History className="h-4 w-4" />}
          >
            Ver histórico
          </Button>

          <Button
            type="button"
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => setConfirmOpen(true)}
          >
            Excluir lead
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 sm:grid-cols-2" noValidate>
          <FormField label="Nome" htmlFor="lead-name" required error={errors.name?.message} dense className="sm:col-span-2">
            <TextInput
              id="lead-name"
              limit={255}
              type="text"
              {...register('name')}
            />
          </FormField>

          <FormField label="E-mail" htmlFor="lead-email" required error={errors.email?.message} dense className="sm:col-span-2">
            <TextInput
              id="lead-email"
              limit={255}
              type="email"
              {...register('email')}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-5 sm:col-span-2 sm:grid-cols-2">
            <FormField label="Telefone" htmlFor="lead-phone" error={errors.phone?.message} dense>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <TextInput
                    id="lead-phone"
                    limit={PHONE_MAX_LENGTH}
                    type="tel"
                    placeholder="+55 (11) 98765-4321"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField label="Etapa" htmlFor="lead-step" required error={errors.step_id?.message} dense>
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

          <FormField label="Valor" htmlFor="lead-value" error={errors.value?.message} dense className="sm:col-span-2">
            <Controller
              control={control}
              name="value"
              render={({ field }) => (
                <TextInput
                  id="lead-value"
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  limit={20}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(maskCurrency(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
          </FormField>

          <FormField label="Site" htmlFor="lead-website" error={errors.website?.message} dense className="sm:col-span-2">
            <TextInput
              id="lead-website"
              limit={512}
              type="url"
              placeholder="https://empresa.com.br"
              {...register('website')}
            />
          </FormField>

          <FormField label="Observações" htmlFor="lead-desc" error={errors.description?.message} dense className="sm:col-span-2">
            <TextArea
              id="lead-desc"
              limit={5000}
              rows={3}
              resizable
              {...register('description')}
            />
          </FormField>

          <fieldset className="grid grid-cols-1 gap-5 rounded-xl border border-zinc-950/[0.07] p-5 sm:col-span-2 sm:grid-cols-2 dark:border-white/[0.07]">
            <legend className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:col-span-2 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
              Endereço
            </legend>

            <FormField label="CEP" htmlFor="lead-addr-zip" error={errors.address?.zip_code?.message} dense>
              <Controller
                control={control}
                name="address.zip_code"
                render={({ field }) => (
                  <TextInput
                    id="lead-addr-zip"
                    type="text"
                    inputMode="numeric"
                    placeholder="00000-000"
                    limit={9}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskZipCode(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField label="Logradouro" htmlFor="lead-addr-street" error={errors.address?.street?.message} dense>
              <TextInput id="lead-addr-street" type="text" limit={255} {...register('address.street')} />
            </FormField>

            <FormField label="Número" htmlFor="lead-addr-number" error={errors.address?.number?.message} dense>
              <TextInput id="lead-addr-number" type="text" limit={20} {...register('address.number')} />
            </FormField>

            <FormField label="Complemento" htmlFor="lead-addr-complement" error={errors.address?.complement?.message} dense>
              <TextInput id="lead-addr-complement" type="text" limit={255} {...register('address.complement')} />
            </FormField>

            <FormField label="Bairro" htmlFor="lead-addr-neighborhood" error={errors.address?.neighborhood?.message} dense>
              <TextInput id="lead-addr-neighborhood" type="text" limit={255} {...register('address.neighborhood')} />
            </FormField>

            <FormField label="Cidade" htmlFor="lead-addr-city" error={errors.address?.city?.message} dense>
              <TextInput id="lead-addr-city" type="text" limit={255} {...register('address.city')} />
            </FormField>

            <FormField label="UF" htmlFor="lead-addr-state" error={errors.address?.state?.message} dense>
              <TextInput
                id="lead-addr-state"
                type="text"
                limit={2}
                placeholder="SP"
                {...register('address.state')}
              />
            </FormField>

            <FormField label="País" htmlFor="lead-addr-country" error={errors.address?.country?.message} dense>
              <TextInput
                id="lead-addr-country"
                type="text"
                limit={100}
                placeholder="Brasil"
                {...register('address.country')}
              />
            </FormField>
          </fieldset>

          <fieldset className="grid grid-cols-1 gap-5 rounded-xl border border-zinc-950/[0.07] p-5 sm:col-span-2 sm:grid-cols-2 dark:border-white/[0.07]">
            <legend className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:col-span-2 dark:text-zinc-400">
              <Megaphone className="h-3.5 w-3.5" strokeWidth={1.8} />
              Origem (UTM)
            </legend>
            <div className="col-span-1 grid grid-cols-1 gap-5 sm:col-span-2 sm:grid-cols-2">
              <FormField label="Source (ex: google)" htmlFor="lead-utm-source" error={errors.utm_source?.message} dense>
                <TextInput
                  id="lead-utm-source"
                  limit={255}
                  type="text"
                  placeholder="google"
                  slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                  {...register('utm_source')}
                />
              </FormField>
              <FormField label="Medium (ex: cpc)" htmlFor="lead-utm-medium" error={errors.utm_medium?.message} dense>
                <TextInput
                  id="lead-utm-medium"
                  limit={255}
                  type="text"
                  placeholder="cpc"
                  slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                  {...register('utm_medium')}
                />
              </FormField>
              <FormField label="Campaign" htmlFor="lead-utm-campaign" error={errors.utm_campaign?.message} dense>
                <TextInput
                  id="lead-utm-campaign"
                  limit={255}
                  type="text"
                  placeholder="lancamento-2026"
                  slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                  {...register('utm_campaign')}
                />
              </FormField>
              <FormField label="Term" htmlFor="lead-utm-term" error={errors.utm_term?.message} dense>
                <TextInput
                  id="lead-utm-term"
                  limit={255}
                  type="text"
                  placeholder="palavra-chave"
                  slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                  {...register('utm_term')}
                />
              </FormField>
              <FormField label="Content" htmlFor="lead-utm-content" error={errors.utm_content?.message} dense>
                <TextInput
                  id="lead-utm-content"
                  limit={255}
                  type="text"
                  placeholder="cta-azul"
                  slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                  {...register('utm_content')}
                />
              </FormField>
              <FormField label="Referrer" htmlFor="lead-referrer" error={errors.referrer?.message} dense>
                <TextInput
                  id="lead-referrer"
                  limit={512}
                  type="text"
                  placeholder="https://google.com"
                  slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                  {...register('referrer')}
                />
              </FormField>
            </div>
            <FormField label="Landing page" htmlFor="lead-landing-page" error={errors.landing_page?.message} dense className="sm:col-span-2">
              <TextInput
                id="lead-landing-page"
                limit={512}
                type="url"
                placeholder="https://site.com.br/lp"
                slotProps={{ htmlInput: { sx: { fontFamily: 'monospace' } } }}
                {...register('landing_page')}
              />
            </FormField>
          </fieldset>

          <div className="flex justify-end border-t border-zinc-950/[0.07] pt-5 sm:col-span-2 dark:border-white/[0.07]">
            <ActionButton type="submit" disabled={updateMutation.isPending || !isDirty}>
              {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </ActionButton>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <CalendarDays className="h-4 w-4" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Agenda do lead
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Próximos 30 dias · {agendaQuery.data?.meta.total ?? 0} evento(s)
            </p>
          </div>
          <ActionButton
            type="button"
            size="small"
            startIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAgendaDrawerOpen(true)}
          >
            Novo evento
          </ActionButton>
        </div>

        {agendaQuery.isPending && (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {agendaQuery.isError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            Não foi possível carregar a agenda deste lead.
          </p>
        )}

        {agendaQuery.isSuccess && (agendaQuery.data?.data.length ?? 0) === 0 && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum evento agendado para este lead.
          </p>
        )}

        {(agendaQuery.data?.data.length ?? 0) > 0 && (
          <ul className="mt-4 divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
            {agendaQuery.data?.data.map((event) => {
              const status = AGENDA_STATUS_META[event.status] ?? {
                tone: 'neutral' as const,
                label: event.status,
              };

              return (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {event.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(event.starts_at)} ·{' '}
                      {AGENDA_TYPE_LABEL[event.type] ?? event.type}
                    </p>
                  </div>
                  <StatusIndicator tone={status.tone} label={status.label} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AgendaEventDrawer
        open={agendaDrawerOpen}
        eventId={null}
        presetLeadId={leadId}
        onClose={() => setAgendaDrawerOpen(false)}
      />

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
