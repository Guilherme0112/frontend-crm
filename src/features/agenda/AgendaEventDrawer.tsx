import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/src/auth/AuthContext';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { Drawer } from '@/src/components/common/Drawer';
import { ErrorState } from '@/src/components/common/ErrorState';
import { FormField } from '@/src/components/common/FormField';
import { Skeleton } from '@/src/components/common/Skeleton';
import { TextArea } from '@/src/components/common/TextArea';
import { TextInput } from '@/src/components/common/TextInput';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { useLeadQuery } from '@/src/features/leads/hooks';
import type {
  AgendaReminderConfigIds,
  CreateAgendaEventPayload,
  UpdateAgendaEventPayload,
} from '@/src/lib/types';
import { LOAD_MORE_LEADS } from './constants';
import { fromLocalInput, toIsoUtc, toLocalInput } from './dates';
import {
  useAgendaEmailConfigsQuery,
  useAgendaEventQuery,
  useAgendaLeadsQuery,
  useAgendaSendingTemplatesQuery,
  useAgendaUsersQuery,
  useAgendaWhatsappSendersQuery,
  useAgendaWhatsappTemplatesQuery,
  useCreateAgendaEventMutation,
  useUpdateAgendaEventMutation,
} from './hooks';

const agendaSchema = z
  .object({
    lead_id: z.number().int().positive('Selecione um lead'),
    assigned_to: z.number().int().positive('Selecione um responsável'),
    title: z
      .string()
      .trim()
      .min(2, 'Informe o título')
      .max(150, 'Máximo de 150 caracteres'),
    type: z.enum(['meeting', 'call', 'follow_up']),
    starts_local: z.string().min(1, 'Informe o início'),
    ends_local: z.string().min(1, 'Informe o término'),
    meeting_url: z.string().trim().optional(),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'canceled', 'no_show']),
    send_reminder: z.boolean(),
    reminder_channel: z.enum(['email', 'whatsapp']).nullable(),
    reminder_email_config_id: z.number().int().positive().nullable(),
    reminder_sending_template_id: z.number().int().positive().nullable(),
    reminder_whatsapp_sender_id: z.number().int().positive().nullable(),
    reminder_whatsapp_template_id: z.number().int().positive().nullable(),
  })
  .superRefine((values, ctx) => {
    const starts = new Date(values.starts_local);
    const ends = new Date(values.ends_local);

    if (Number.isNaN(starts.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['starts_local'], message: 'Data de início inválida' });
      return;
    }
    if (Number.isNaN(ends.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['ends_local'], message: 'Data de término inválida' });
      return;
    }
    if (ends <= starts) {
      ctx.addIssue({
        code: 'custom',
        path: ['ends_local'],
        message: 'O término deve ser posterior ao início',
      });
      return;
    }
    if (ends.getTime() - starts.getTime() < 15 * 60 * 1000) {
      ctx.addIssue({
        code: 'custom',
        path: ['ends_local'],
        message: 'O evento deve ter duração mínima de 15 minutos',
      });
    }

    if (!values.send_reminder || !values.reminder_channel) return;

    if (values.reminder_channel === 'email') {
      if (!values.reminder_email_config_id || !values.reminder_sending_template_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['reminder_email_config_id'],
          message: 'Selecione a configuração e o template de e-mail',
        });
      }
    } else if (!values.reminder_whatsapp_sender_id || !values.reminder_whatsapp_template_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['reminder_whatsapp_sender_id'],
        message: 'Selecione o remetente e o template do WhatsApp',
      });
    }
  });

type AgendaFormValues = z.infer<typeof agendaSchema>;

interface AgendaEventDrawerProps {
  open: boolean;
  eventId: number | null;
  presetLeadId?: number | null;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: 'meeting', label: 'Reunião' },
  { value: 'call', label: 'Ligação' },
  { value: 'follow_up', label: 'Follow-up' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Agendado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'no_show', label: 'Não compareceu' },
];

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

function defaultInterval(): { starts_local: string; ends_local: string } {
  const starts = new Date(Date.now() + 60 * 60 * 1000);
  starts.setMinutes(0, 0, 0);
  const ends = new Date(starts.getTime() + 30 * 60 * 1000);
  return {
    starts_local: toLocalInput(toIsoUtc(starts)),
    ends_local: toLocalInput(toIsoUtc(ends)),
  };
}

function reminderConfigPayload(values: AgendaFormValues): AgendaReminderConfigIds {
  if (!values.send_reminder) {
    return {
      reminder_email_config_id: null,
      reminder_sending_template_id: null,
      reminder_whatsapp_sender_id: null,
      reminder_whatsapp_template_id: null,
    };
  }

  if (values.reminder_channel === 'email') {
    return {
      reminder_email_config_id: values.reminder_email_config_id,
      reminder_sending_template_id: values.reminder_sending_template_id,
      reminder_whatsapp_sender_id: null,
      reminder_whatsapp_template_id: null,
    };
  }

  return {
    reminder_email_config_id: null,
    reminder_sending_template_id: null,
    reminder_whatsapp_sender_id: values.reminder_whatsapp_sender_id,
    reminder_whatsapp_template_id: values.reminder_whatsapp_template_id,
  };
}

export function AgendaEventDrawer({ open, eventId, presetLeadId, onClose }: AgendaEventDrawerProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      lead_id: 0,
      assigned_to: 0,
      title: '',
      type: 'meeting',
      starts_local: '',
      ends_local: '',
      meeting_url: '',
      notes: '',
      status: 'scheduled',
      send_reminder: true,
      reminder_channel: 'email',
      reminder_email_config_id: null,
      reminder_sending_template_id: null,
      reminder_whatsapp_sender_id: null,
      reminder_whatsapp_template_id: null,
    },
  });

  const sendReminder = watch('send_reminder');
  const channel = watch('reminder_channel');
  const selectedLeadId = watch('lead_id');
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const initialValues = useRef<AgendaFormValues | null>(null);

  useEffect(() => {
    setLeadPage(1);
  }, [leadSearch]);

  // Drawer fechado não busca nada. Na abertura: só o evento em edição; o resto
  // vem quando o usuário abre cada seletor (lead, responsável, canal).
  const eventQuery = useAgendaEventQuery(eventId, open);
  const usersQuery = useAgendaUsersQuery(open && assigneePickerOpen);
  const leadsQuery = useAgendaLeadsQuery(open && leadPickerOpen, leadSearch || undefined, leadPage);
  // O lead já vinculado pode não estar na primeira página da busca: buscamos só ele.
  const presetLeadQuery = useLeadQuery(open && !eventId && presetLeadId ? presetLeadId : null);
  const reminderReady = open && (!eventId || eventQuery.isSuccess);
  const emailLookupEnabled = reminderReady && sendReminder && channel === 'email';
  const whatsappLookupEnabled = reminderReady && sendReminder && channel === 'whatsapp';
  const emailConfigsQuery = useAgendaEmailConfigsQuery(emailLookupEnabled);
  const templatesQuery = useAgendaSendingTemplatesQuery(emailLookupEnabled);
  const whatsappSendersQuery = useAgendaWhatsappSendersQuery(whatsappLookupEnabled);
  const whatsappTemplatesQuery = useAgendaWhatsappTemplatesQuery(whatsappLookupEnabled);
  const createMutation = useCreateAgendaEventMutation();
  const updateMutation = useUpdateAgendaEventMutation();

  useEffect(() => {
    if (!open) return;

    let values: AgendaFormValues;

    if (eventQuery.data) {
      const event = eventQuery.data;
      values = {
        lead_id: event.lead_id,
        assigned_to: event.assigned_to,
        title: event.title,
        type: event.type,
        starts_local: toLocalInput(event.starts_at),
        ends_local: toLocalInput(event.ends_at),
        meeting_url: event.meeting_url ?? '',
        notes: event.notes ?? '',
        status: event.status,
        send_reminder: event.send_reminder,
        // O Resource não expõe os IDs de config — quando o lembrete está ativo,
        // manter o canal é suficiente para não reenfileirar o job em "só notes".
        reminder_channel: event.reminder_channel ?? 'email',
        reminder_email_config_id: null,
        reminder_sending_template_id: null,
        reminder_whatsapp_sender_id: null,
        reminder_whatsapp_template_id: null,
      };
    } else {
      values = {
        lead_id: presetLeadId ?? 0,
        assigned_to: user?.id ?? 0,
        title: '',
        type: 'meeting',
        ...defaultInterval(),
        meeting_url: '',
        notes: '',
        status: 'scheduled',
        send_reminder: true,
        reminder_channel: 'email',
        reminder_email_config_id: null,
        reminder_sending_template_id: null,
        reminder_whatsapp_sender_id: null,
        reminder_whatsapp_template_id: null,
      };
    }

    initialValues.current = values;
    reset(values);
  }, [open, eventQuery.data, presetLeadId, user?.id, reset]);

  const onSubmit = async (values: AgendaFormValues) => {
    const startsAt = fromLocalInput(values.starts_local);
    const endsAt = fromLocalInput(values.ends_local);
    const isEditing = Boolean(eventQuery.data);
    const event = eventQuery.data;

    try {
      if (!isEditing || !event) {
        const payload: CreateAgendaEventPayload = {
          lead_id: values.lead_id,
          assigned_to: values.assigned_to,
          title: values.title.trim(),
          type: values.type,
          starts_at: startsAt,
          ends_at: endsAt,
          meeting_url: values.meeting_url?.trim() || null,
          notes: values.notes?.trim() || null,
          send_reminder: values.send_reminder,
          reminder_channel: values.send_reminder ? values.reminder_channel : null,
          ...reminderConfigPayload(values),
        };
        await createMutation.mutateAsync(payload);
        toast.success('Evento agendado');
      } else {
        const payload: UpdateAgendaEventPayload = {
          lead_id: values.lead_id,
          assigned_to: values.assigned_to,
          title: values.title.trim(),
          type: values.type,
          meeting_url: values.meeting_url?.trim() || null,
          notes: values.notes?.trim() || null,
        };

        // Enviar os mesmos horários não conta como remarcação no backend.
        // Ainda assim, omitimos para não reenfileirar o job sem necessidade.
        if (startsAt !== event.starts_at || endsAt !== event.ends_at) {
          payload.starts_at = startsAt;
          payload.ends_at = endsAt;
        }
        if (values.status !== event.status) {
          payload.status = values.status;
        }

        const before = initialValues.current;
        const reminderChanged =
          before === null ||
          values.send_reminder !== before.send_reminder ||
          values.reminder_channel !== before.reminder_channel ||
          values.reminder_email_config_id !== before.reminder_email_config_id ||
          values.reminder_sending_template_id !== before.reminder_sending_template_id ||
          values.reminder_whatsapp_sender_id !== before.reminder_whatsapp_sender_id ||
          values.reminder_whatsapp_template_id !== before.reminder_whatsapp_template_id;

        // Só mexe no lembrete quando o usuário alterou algo: assim "editar só
        // notes" não incrementa reminder_version nem reenfileira o job.
        if (reminderChanged) {
          const resolved: AgendaFormValues = {
            ...values,
            reminder_email_config_id:
              values.reminder_email_config_id ?? emailConfigsQuery.data?.[0]?.id ?? null,
            reminder_sending_template_id:
              values.reminder_sending_template_id ?? templatesQuery.data?.[0]?.id ?? null,
            reminder_whatsapp_sender_id:
              values.reminder_whatsapp_sender_id ?? whatsappSendersQuery.data?.[0]?.id ?? null,
            reminder_whatsapp_template_id:
              values.reminder_whatsapp_template_id ?? whatsappTemplatesQuery.data?.[0]?.id ?? null,
          };
          payload.send_reminder = resolved.send_reminder;
          payload.reminder_channel = resolved.send_reminder ? resolved.reminder_channel : null;
          Object.assign(payload, reminderConfigPayload(resolved));
        }

        await updateMutation.mutateAsync({
          id: event.id,
          leadId: event.lead_id,
          payload,
        });
        toast.success('Evento atualizado');
      }

      onClose();
    } catch (error) {
      const mapped = applyServerErrors(error, setError, {
        starts_at: 'starts_local',
        ends_at: 'ends_local',
      });
      if (!mapped) {
        toast.error('Erro ao salvar evento', getApiErrorMessage(error));
      }
    }
  };

  // Garante que o lead selecionado apareça mesmo se estiver fora da página
  // atual da busca (edição ou criação a partir do detalhe do lead).
  const currentLead =
    eventQuery.data?.lead_id === selectedLeadId && eventQuery.data.lead
      ? {
          id: selectedLeadId,
          name: eventQuery.data.lead.name,
          email: eventQuery.data.lead.email,
        }
      : presetLeadQuery.data?.id === selectedLeadId
        ? presetLeadQuery.data
        : null;

  const leadOptionsMap = new Map<string, { value: string; label: string; description?: string }>();
  if (currentLead) {
    leadOptionsMap.set(String(currentLead.id), {
      value: String(currentLead.id),
      label: currentLead.name,
      description: currentLead.email,
    });
  }
  for (const lead of leadsQuery.data ?? []) {
    const value = String(lead.id);
    if (!leadOptionsMap.has(value)) {
      leadOptionsMap.set(value, { value, label: lead.name, description: lead.email });
    }
  }
  const leadOptions = [
    ...leadOptionsMap.values(),
    ...(leadPage < (leadsQuery.meta?.last_page ?? 1)
      ? [{ value: LOAD_MORE_LEADS, label: 'Carregar mais leads…' }]
      : []),
  ];
  const userOptions = (usersQuery.data ?? []).map((user) => ({
    value: String(user.id),
    label: user.name,
  }));
  const emailConfigOptions = (emailConfigsQuery.data ?? []).map((config) => ({
    value: String(config.id),
    label: config.name,
    description: config.from_address,
  }));
  const templateOptions = (templatesQuery.data ?? []).map((template) => ({
    value: String(template.id),
    label: template.name,
  }));
  const whatsappSenderOptions = (whatsappSendersQuery.data ?? []).map((sender) => ({
    value: String(sender.id),
    label: sender.name,
    description: sender.phone_number ?? '',
  }));
  const whatsappTemplateOptions = (whatsappTemplatesQuery.data ?? []).map((template) => ({
    value: String(template.id),
    label: template.name,
    description: template.language,
  }));

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isTerminal = Boolean(eventQuery.data && eventQuery.data.status !== 'scheduled');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={eventQuery.data ? 'Editar evento' : 'Novo evento'}
      subtitle={eventQuery.data?.lead?.name ?? 'Agenda de leads'}
    >
      {eventId && eventQuery.isPending && (
        <div className="space-y-5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {eventId && eventQuery.isError && (
        <ErrorState
          title="Não foi possível carregar o evento"
          error={eventQuery.error}
          onRetry={() => void eventQuery.refetch()}
        />
      )}

      {(!eventId || eventQuery.isSuccess) && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5" noValidate>
          <FormField label="Lead" htmlFor="agenda-lead" required error={errors.lead_id?.message} dense>
            <Controller
              name="lead_id"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  id="agenda-lead"
                  value={field.value > 0 ? String(field.value) : ''}
                  onChange={(value) => {
                    if (value === LOAD_MORE_LEADS) {
                      setLeadPage((page) => page + 1);
                      return;
                    }
                    field.onChange(value ? Number(value) : 0);
                  }}
                  onOpen={() => setLeadPickerOpen(true)}
                  onSearch={setLeadSearch}
                  options={leadOptions}
                  placeholder="Selecione o lead"
                  emptyMessage="Nenhum lead encontrado"
                  loading={leadPickerOpen && leadsQuery.isFetching}
                  hasError={Boolean(errors.lead_id)}
                />
              )}
            />
          </FormField>

          <FormField
            label="Responsável"
            htmlFor="agenda-assignee"
            required
            error={errors.assigned_to?.message}
            dense
          >
            <Controller
              name="assigned_to"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  id="agenda-assignee"
                  value={field.value > 0 ? String(field.value) : ''}
                  onChange={(value) => field.onChange(value ? Number(value) : 0)}
                  onOpen={() => setAssigneePickerOpen(true)}
                  options={userOptions}
                  placeholder="Selecione o responsável"
                  emptyMessage="Nenhum usuário encontrado"
                  hasError={Boolean(errors.assigned_to)}
                />
              )}
            />
          </FormField>

          <FormField label="Título" htmlFor="agenda-title" required error={errors.title?.message} dense>
            <TextInput id="agenda-title" limit={150} type="text" {...register('title')} />
          </FormField>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Tipo" htmlFor="agenda-type" required error={errors.type?.message} dense>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    id="agenda-type"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    options={TYPE_OPTIONS}
                    clearable={false}
                    hasError={Boolean(errors.type)}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Status"
              htmlFor="agenda-status"
              error={errors.status?.message}
              hint={isTerminal ? 'Use as ações rápidas para reabrir.' : undefined}
              dense
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    id="agenda-status"
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    options={STATUS_OPTIONS}
                    clearable={false}
                    disabled={isTerminal}
                    hasError={Boolean(errors.status)}
                  />
                )}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              label="Início"
              htmlFor="agenda-starts"
              required
              error={errors.starts_local?.message}
              dense
            >
              <Controller
                name="starts_local"
                control={control}
                render={({ field }) => (
                  <TextInput
                    id="agenda-starts"
                    type="datetime-local"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Término"
              htmlFor="agenda-ends"
              required
              error={errors.ends_local?.message}
              dense
            >
              <Controller
                name="ends_local"
                control={control}
                render={({ field }) => (
                  <TextInput
                    id="agenda-ends"
                    type="datetime-local"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField label="Link da reunião" htmlFor="agenda-url" error={errors.meeting_url?.message} dense>
            <TextInput
              id="agenda-url"
              type="url"
              limit={2048}
              placeholder="https://meet.google.com/..."
              {...register('meeting_url')}
            />
          </FormField>

          <FormField label="Observações internas" htmlFor="agenda-notes" error={errors.notes?.message} dense>
            <TextArea id="agenda-notes" limit={5000} rows={3} resizable {...register('notes')} />
          </FormField>

          <fieldset className="rounded-xl border border-zinc-950/[0.07] p-4 dark:border-white/[0.07]">
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Lembrete
            </legend>

            <Controller
              name="send_reminder"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Enviar lembrete 1 hora antes"
                />
              )}
            />

            {sendReminder && (
              <div className="mt-5 grid grid-cols-1 gap-5">
                <FormField
                  label="Canal"
                  htmlFor="agenda-reminder-channel"
                  error={errors.reminder_channel?.message}
                  dense
                >
                  <Controller
                    name="reminder_channel"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        id="agenda-reminder-channel"
                        value={field.value ?? ''}
                        onChange={(value) => field.onChange(value)}
                        options={CHANNEL_OPTIONS}
                        clearable={false}
                        hasError={Boolean(errors.reminder_channel)}
                      />
                    )}
                  />
                </FormField>

                {channel === 'email' && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField
                      label="Configuração de e-mail"
                      htmlFor="agenda-email-config"
                      error={errors.reminder_email_config_id?.message}
                      dense
                    >
                      <Controller
                        name="reminder_email_config_id"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            id="agenda-email-config"
                            value={field.value ? String(field.value) : ''}
                            onChange={(value) => field.onChange(value ? Number(value) : null)}
                            options={emailConfigOptions}
                            placeholder="Selecione..."
                            hasError={Boolean(errors.reminder_email_config_id)}
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Template de e-mail"
                      htmlFor="agenda-email-template"
                      error={errors.reminder_sending_template_id?.message}
                      dense
                    >
                      <Controller
                        name="reminder_sending_template_id"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            id="agenda-email-template"
                            value={field.value ? String(field.value) : ''}
                            onChange={(value) => field.onChange(value ? Number(value) : null)}
                            options={templateOptions}
                            placeholder="Selecione..."
                            hasError={Boolean(errors.reminder_sending_template_id)}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                )}

                {channel === 'whatsapp' && (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField
                      label="Remetente WhatsApp"
                      htmlFor="agenda-whatsapp-sender"
                      error={errors.reminder_whatsapp_sender_id?.message}
                      dense
                    >
                      <Controller
                        name="reminder_whatsapp_sender_id"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            id="agenda-whatsapp-sender"
                            value={field.value ? String(field.value) : ''}
                            onChange={(value) => field.onChange(value ? Number(value) : null)}
                            options={whatsappSenderOptions}
                            placeholder="Selecione..."
                            hasError={Boolean(errors.reminder_whatsapp_sender_id)}
                          />
                        )}
                      />
                    </FormField>

                    <FormField
                      label="Template WhatsApp"
                      htmlFor="agenda-whatsapp-template"
                      error={errors.reminder_whatsapp_template_id?.message}
                      dense
                    >
                      <Controller
                        name="reminder_whatsapp_template_id"
                        control={control}
                        render={({ field }) => (
                          <Autocomplete
                            id="agenda-whatsapp-template"
                            value={field.value ? String(field.value) : ''}
                            onChange={(value) => field.onChange(value ? Number(value) : null)}
                            options={whatsappTemplateOptions}
                            placeholder="Selecione..."
                            hasError={Boolean(errors.reminder_whatsapp_template_id)}
                          />
                        )}
                      />
                    </FormField>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Empilhado no celular, uma linha só de sm para cima. A ordem do DOM é
              a ordem do celular — ação principal no topo, como manda a spec de
              diálogos do Material para botões empilhados. As classes order-*
              devolvem o layout de desktop: Cancelar à esquerda, principal à
              direita. O submit vir primeiro no DOM também faz o Enter num campo
              de texto cair nele, e não no Cancelar. */}
          <div className="flex flex-col gap-2 border-t border-zinc-950/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-end dark:border-white/[0.07]">
            <ActionButton
              type="submit"
              disabled={isPending}
              className="sm:order-2"
              sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 40, sm: 'auto' }, flexShrink: 0 }}
            >
              {isPending ? 'Salvando...' : eventQuery.data ? 'Salvar alterações' : 'Agendar'}
            </ActionButton>
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={onClose}
              disabled={isPending}
              className="sm:order-1"
              sx={{ width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 40, sm: 'auto' }, flexShrink: 0 }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
