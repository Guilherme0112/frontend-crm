import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, Trash2 } from 'lucide-react';
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
        subtitle={leadQuery.data
          ? `Etapa: ${leadQuery.data.step_name ?? steps.find((step) => step.id === leadQuery.data?.step_id)?.name ?? '—'}`
          : undefined}
      >
        {leadQuery.isPending ? (
          <div className="space-y-6">
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
            <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.07] pb-4 text-xs text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
              <span>Criado em {formatDateTime(leadQuery.data.created_at)}</span>
              <Link
                to={`/leads/${leadQuery.data.id}`}
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                <span>Abrir página</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <FormField label="Nome" htmlFor="drawer-lead-name" required error={errors.name?.message}>
                <TextInput
                  id="drawer-lead-name"
                  type="text"
                  hasError={Boolean(errors.name)}
                  {...register('name')}
                />
              </FormField>

              <FormField label="E-mail" htmlFor="drawer-lead-email" required error={errors.email?.message}>
                <TextInput
                  id="drawer-lead-email"
                  type="email"
                  hasError={Boolean(errors.email)}
                  {...register('email')}
                />
              </FormField>

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField label="Telefone" htmlFor="drawer-lead-phone" error={errors.phone?.message}>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextInput
                        id="drawer-lead-phone"
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

                <FormField label="Etapa" htmlFor="drawer-lead-step" required error={errors.step_id?.message}>
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

              <FormField label="Site" htmlFor="drawer-lead-website" error={errors.website?.message}>
                <TextInput
                  id="drawer-lead-website"
                  type="url"
                  placeholder="https://empresa.com.br"
                  hasError={Boolean(errors.website)}
                  {...register('website')}
                />
              </FormField>

              <FormField label="Observações" htmlFor="drawer-lead-description" error={errors.description?.message}>
                <TextArea
                  id="drawer-lead-description"
                  hasError={Boolean(errors.description)}
                  {...register('description')}
                />
              </FormField>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
                <Button variant="outlined" color="error" startIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmOpen(true)}>
                  Excluir
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outlined" color="inherit" onClick={onClose}>
                    Fechar
                  </Button>
                  <Button variant="contained" disabled={updateMutation.isPending || !isDirty} type="submit">
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
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
