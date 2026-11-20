import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, FileText, Globe, Trash2, UserRound } from 'lucide-react';
import ActionButton from '@/src/components/common/Button';
import { Drawer } from '@/src/components/common/Drawer';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
import { ConfirmDialog } from '@/src/components/common/ConfirmDialog';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { PHONE_REGEX, formatDateTime, maskPhone } from '@/src/lib/format';
import type { Lead, Step } from '@/src/lib/types';
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
  step_id: z.number({ message: 'Selecione uma etapa' }).int().min(1, 'Selecione uma etapa'),
  description: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadDrawerProps {
  leadId: number | null;
  steps: Step[];
  onClose: () => void;
}

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-blue-600 dark:text-blue-400">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        {children}
      </span>
    </div>
  );
}

function LeadSummary({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const initials = lead.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-950/[0.06] bg-gradient-to-br from-blue-50 via-white to-white p-5 dark:from-blue-950/30 dark:via-[#17171a] dark:to-[#17171a] dark:border-white/[0.07]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-base font-semibold text-white shadow-sm">
          {initials || '?'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {lead.name}
            </h2>
            {lead.step_name && (
              <Chip size="small" variant="outlined" color="primary" label={lead.step_name} />
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">{lead.email}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            Lead #{lead.id} · Criado em {formatDateTime(lead.created_at)}
          </p>
        </div>

        <ActionButton
          component={Link}
          to={`/leads/${lead.id}`}
          onClick={onClose}
          size="small"
          startIcon={<ExternalLink className="h-4 w-4" />}
        >
          Ver página
        </ActionButton>
      </div>
    </div>
  );
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
    formState: { errors },
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
          email: values.email.trim().toLowerCase(),
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

  const onDelete = async () => {
    if (!leadId) return;
    try {
      await deleteMutation.mutateAsync(leadId);
      toast.success('Lead excluído');
      setConfirmOpen(false);
      onClose();
    } catch (error) {
      toast.error('Erro ao excluir lead', getApiErrorMessage(error));
    }
  };

  return (
    <>
      <Drawer
        open={Boolean(leadId)}
        onClose={onClose}
        title="Editar lead"
        subtitle={leadQuery.data?.email}
      >
        {leadQuery.isLoading && (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {leadQuery.isError && (
          <ErrorState
            title="Não foi possível carregar o lead"
            error={leadQuery.error}
            onRetry={() => void leadQuery.refetch()}
          />
        )}

        {leadQuery.data && (
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5" noValidate>
            <LeadSummary lead={leadQuery.data} onClose={onClose} />

            <section className="grid grid-cols-1 gap-5">
              <SectionTitle icon={<UserRound className="h-3.5 w-3.5" />}>
                Dados do lead
              </SectionTitle>

              <FormField label="Nome" htmlFor="drawer-lead-name" required error={errors.name?.message} dense>
                <TextInput
                  id="drawer-lead-name"
                  type="text"
                  limit={255}
                  hasError={Boolean(errors.name)}
                  {...register('name')}
                />
              </FormField>

              <FormField label="E-mail" htmlFor="drawer-lead-email" required error={errors.email?.message} dense>
                <TextInput
                  id="drawer-lead-email"
                  type="email"
                  limit={255}
                  hasError={Boolean(errors.email)}
                  {...register('email')}
                />
              </FormField>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Telefone" htmlFor="drawer-lead-phone" error={errors.phone?.message} dense>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextInput
                        id="drawer-lead-phone"
                        type="tel"
                        placeholder="(11) 98765-4321"
                        limit={15}
                        hasError={Boolean(errors.phone)}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>

                <FormField label="Etapa" htmlFor="drawer-lead-step" required error={errors.step_id?.message} dense>
                  <Controller
                    name="step_id"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        id="drawer-lead-step"
                        value={field.value > 0 ? String(field.value) : ''}
                        onChange={(v) => field.onChange(v === '' ? 0 : Number(v))}
                        placeholder="Selecione uma etapa..."
                        emptyMessage="Nenhuma etapa encontrada"
                        hasError={Boolean(errors.step_id)}
                        options={steps.map((step) => ({ value: String(step.id), label: step.name }))}
                      />
                    )}
                  />
                </FormField>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 rounded-xl border border-zinc-950/[0.06] bg-[#fafaf9]/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <SectionTitle icon={<Globe className="h-3.5 w-3.5" />}>
                Presença online
              </SectionTitle>

              <FormField label="Site" htmlFor="drawer-lead-website" error={errors.website?.message} dense>
                <TextInput
                  id="drawer-lead-website"
                  type="url"
                  placeholder="https://empresa.com.br"
                  limit={512}
                  hasError={Boolean(errors.website)}
                  {...register('website')}
                />
              </FormField>
            </section>

            <section className="grid grid-cols-1 gap-5">
              <SectionTitle icon={<FileText className="h-3.5 w-3.5" />}>
                Observações
              </SectionTitle>

              <FormField label="Observações" htmlFor="drawer-lead-description" error={errors.description?.message} dense>
                <TextArea
                  id="drawer-lead-description"
                  limit={5000}
                  rows={3}
                  resizable
                  hasError={Boolean(errors.description)}
                  {...register('description')}
                />
              </FormField>
            </section>

            <div className="sticky bottom-0 z-10 mt-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-950/[0.07] bg-white/95 p-3 shadow-sm backdrop-blur dark:border-white/[0.07] dark:bg-[#17171a]/95">
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setConfirmOpen(true)}
              >
                Excluir
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outlined" color="inherit" size="small" onClick={onClose}>
                  Fechar
                </Button>
                <Button type="submit" variant="contained" size="small" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir lead"
        description="Esta ação não pode ser desfeita. Deseja continuar?"
        confirmLabel="Excluir"
        isPending={deleteMutation.isPending}
        onConfirm={() => void onDelete()}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
