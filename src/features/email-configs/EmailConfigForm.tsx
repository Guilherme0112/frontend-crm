import Button from '@mui/material/Button';
import ActionButton from '@/src/components/common/Button';
import { TextInput } from '@/src/components/common/TextInput';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Pencil } from 'lucide-react';
import { Autocomplete } from '@/src/components/common/Autocomplete';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { applyServerErrors } from '@/src/lib/formErrors';
import type { EmailConfig, EmailEncryption } from '@/src/lib/types';

const HOST_REGEX = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$/;

function buildEmailConfigSchema(isEdit: boolean) {
  return z
    .object({
      name: z.string().trim().min(1, 'Informe o nome da configuração').max(255, 'Máximo de 255 caracteres'),
      host: z
        .string()
        .trim()
        .min(1, 'Informe o host')
        .max(255, 'Máximo de 255 caracteres')
        .regex(HOST_REGEX, 'Informe um hostname ou IP válido (sem espaços nem protocolo)'),
      port: z
        .number({ message: 'Informe uma porta válida' })
        .int('A porta deve ser um número inteiro')
        .min(1, 'A porta deve ser maior ou igual a 1')
        .max(65535, 'A porta deve ser menor ou igual a 65535'),
      encryption: z.enum(['tls', 'ssl', 'none'], { message: 'Selecione a criptografia' }),
      username: z.string().trim().min(1, 'Informe o usuário').max(255, 'Máximo de 255 caracteres'),
      password: z.string(),
      from_address: z.string().trim().min(1, 'Informe o email remetente').email('Informe um email válido'),
      from_name: z.string().trim().min(1, 'Informe o nome do remetente').max(255, 'Máximo de 255 caracteres'),
    })
    .superRefine((data, ctx) => {
      if (!isEdit && data.password.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['password'], message: 'Informe a senha' });
      }
    });
}

export type EmailConfigFormValues = z.infer<ReturnType<typeof buildEmailConfigSchema>>;

interface EmailConfigFormProps {
  initialConfig: EmailConfig | null;
  isSubmitting: boolean;
  submitError: unknown;
  onSubmit: (values: EmailConfigFormValues) => void;
  onCancel: () => void;
}

const ENCRYPTION_OPTIONS: { value: EmailEncryption; label: string }[] = [
  { value: 'tls', label: 'TLS' },
  { value: 'ssl', label: 'SSL' },
  { value: 'none', label: 'Nenhum (sem criptografia)' },
];

export function EmailConfigForm({
  initialConfig,
  isSubmitting,
  submitError,
  onSubmit,
  onCancel,
}: EmailConfigFormProps) {
  const isEdit = Boolean(initialConfig);
  const passwordAlreadySet = initialConfig?.has_password ?? false;
  const [changingPassword, setChangingPassword] = useState(!isEdit || !passwordAlreadySet);
  const schema = useMemo(() => buildEmailConfigSchema(isEdit), [isEdit]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<EmailConfigFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialConfig?.name ?? '',
      host: initialConfig?.host ?? '',
      port: initialConfig?.port ?? 587,
      encryption: initialConfig?.encryption ?? 'tls',
      username: initialConfig?.username ?? '',
      password: '',
      from_address: initialConfig?.from_address ?? '',
      from_name: initialConfig?.from_name ?? '',
    },
  });

  useEffect(() => {
    if (submitError) {
      applyServerErrors(submitError, setError);
    }
  }, [submitError, setError]);

  useEffect(() => {
    reset({
      name: initialConfig?.name ?? '',
      host: initialConfig?.host ?? '',
      port: initialConfig?.port ?? 587,
      encryption: initialConfig?.encryption ?? 'tls',
      username: initialConfig?.username ?? '',
      password: '',
      from_address: initialConfig?.from_address ?? '',
      from_name: initialConfig?.from_name ?? '',
    });
    setChangingPassword(!initialConfig || !initialConfig.has_password);
  }, [initialConfig, reset]);

  const submit = handleSubmit((values) => {
    const password = changingPassword ? values.password : '';
    onSubmit({ ...values, password });
  });

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <FormField
        label="Nome da configuração"
        htmlFor="ec-name"
        required
        error={errors.name?.message}
        className="sm:col-span-2"
      >
        <TextInput
          id="ec-name"
          limit={255}
          type="text"
          placeholder="Ex.: Mailtrap Produção"
          autoComplete="off"
          {...register('name')}
        />
      </FormField>

      <FormField label="Host" htmlFor="ec-host" required error={errors.host?.message}>
        <TextInput
          id="ec-host"
          limit={255}
          type="text"
          placeholder="smtp.mailtrap.io"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`${inputClassName(Boolean(errors.host))} font-mono`}
          {...register('host')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Porta" htmlFor="ec-port" required error={errors.port?.message}>
          <TextInput
            id="ec-port"
            limit={5}
            type="number"
            min={1}
            max={65535}
            className={`${inputClassName(Boolean(errors.port))} font-mono tabular-nums`}
            {...register('port', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label="Criptografia"
          htmlFor="ec-encryption"
          required
          error={errors.encryption?.message}
        >
          <Controller
            name="encryption"
            control={control}
            render={({ field }) => (
              <Autocomplete
                id="ec-encryption"
                value={field.value}
                onChange={(v) => field.onChange((v || 'tls') as EmailEncryption)}
                placeholder="Selecione a criptografia..."
                ariaLabel="Criptografia"
                clearable={false}
                hasError={Boolean(errors.encryption)}
                options={ENCRYPTION_OPTIONS}
              />
            )}
          />
        </FormField>
      </div>

      <FormField label="Usuário" htmlFor="ec-username" required error={errors.username?.message}>
        <TextInput
          id="ec-username"
          limit={255}
          type="text"
          placeholder="demo@example.com"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`${inputClassName(Boolean(errors.username))} font-mono`}
          {...register('username')}
        />
      </FormField>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label
            htmlFor="ec-password"
            className="block text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
          >
            Senha{isEdit ? '' : ' *'}
          </label>
          {isEdit && passwordAlreadySet && !changingPassword && (
            <ActionButton
              type="button"
              size="small"
              onClick={() => setChangingPassword(true)}
              startIcon={<Pencil className="h-3 w-3" />}
            >
              Alterar senha
            </ActionButton>
          )}
        </div>

        {changingPassword ? (
          <>
            <TextInput
              id="ec-password"
              limit={255}
              type="password"
              autoComplete="new-password"
              placeholder={isEdit ? 'Nova senha (em branco mantém a atual)' : 'Senha SMTP'}
              {...register('password')}
            />
            {errors.password && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
            {isEdit && (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                Deixe em branco para manter a senha atual.
              </p>
            )}
          </>
        ) : (
          <div
            className="flex h-[38px] items-center justify-between rounded-lg border border-zinc-950/[0.08] bg-zinc-50 px-3.5 dark:border-white/[0.08] dark:bg-white/[0.03]"
            aria-label="Senha definida"
          >
            <span className="flex items-center gap-2 font-mono text-sm tracking-widest text-zinc-500 dark:text-zinc-400">
              <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
              ••••••••
            </span>
            {isEdit && (
              <ActionButton type="button" size="small" onClick={() => setChangingPassword(true)}>
                Alterar
              </ActionButton>
            )}
          </div>
        )}
      </div>

      <FormField
        label="Email remetente"
        htmlFor="ec-from-address"
        required
        error={errors.from_address?.message}
      >
        <TextInput
          id="ec-from-address"
          limit={255}
          type="email"
          placeholder="noreply@example.com"
          autoComplete="off"
          className={`${inputClassName(Boolean(errors.from_address))} font-mono`}
          {...register('from_address')}
        />
      </FormField>

      <FormField
        label="Nome do remetente"
        htmlFor="ec-from-name"
        required
        error={errors.from_name?.message}
      >
        <TextInput
          id="ec-from-name"
          limit={255}
          type="text"
          placeholder="SaldUp CRM"
          autoComplete="off"
          {...register('from_name')}
        />
      </FormField>

      <div className="flex justify-end gap-3 border-t border-zinc-950/[0.07] pt-4 sm:col-span-2 dark:border-white/[0.07]">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar configuração'}
        </Button>
      </div>
    </form>
  );
}