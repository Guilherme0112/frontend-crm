import ActionButton from '@/src/components/common/Button';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/src/auth/AuthContext';
import { useCompanyQuery, useUpdateCompanyMutation } from './hooks';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { useToast } from '@/src/components/common/Toast';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { ZIP_REGEX, maskZipCode, maskCpfCnpj } from '@/src/lib/format';

const companySchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da empresa'),
  description: z.string().optional(),
  website: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: 'Informe uma URL iniciando com http:// ou https://',
    }),
  document_number: z
    .string()
    .trim()
    .max(18, 'CNPJ deve estar no formato 00.000.000/0000-00')
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const digits = val.replace(/\D/g, '');
        return digits.length === 11 || digits.length === 14;
      },
      { message: 'Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ)' },
    ),
  address: z.object({
    zip_code: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || ZIP_REGEX.test(val), {
        message: 'CEP deve estar no formato 00000-000',
      }),
    city: z.string().optional(),
    state: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || val.length === 2, {
        message: 'UF deve ter 2 letras (ex.: SP)',
      }),
  }),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export function CompanyPage() {
  const { toast } = useToast();
  const { refreshSession } = useAuth();
  const companyQuery = useCompanyQuery();
  const updateMutation = useUpdateCompanyMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      description: '',
      website: '',
      document_number: '',
      address: { zip_code: '', city: '', state: '' },
    },
  });

  useEffect(() => {
    if (companyQuery.data) {
      const c = companyQuery.data;
      reset({
        name: c.name ?? '',
        description: c.description ?? '',
        website: c.website ?? '',
        document_number: maskCpfCnpj(c.document_number ?? ''),
        address: {
          zip_code: c.address?.zip_code ?? '',
          city: c.address?.city ?? '',
          state: c.address?.state ?? '',
        },
      });
    }
  }, [companyQuery.data, reset]);

  const onSubmit = async (values: CompanyFormValues) => {
    const addr = values.address;
    const hasAnyAddressField = Object.values(addr).some((v) => Boolean(v && v.trim()));

    try {
      await updateMutation.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || null,
        website: values.website?.trim() || null,
        document_number: values.document_number ? values.document_number.replace(/\D/g, '') : null,
        address: hasAnyAddressField
          ? {
              zip_code: addr.zip_code?.trim() || null,
              city: addr.city?.trim() || null,
              state: addr.state?.trim().toUpperCase() || null,
              country: 'Brasil',
            }
          : null,
      });
      await refreshSession();
      toast.success('Dados da empresa atualizados');
    } catch (error) {
      applyServerErrors(error, setError);
      toast.error('Erro ao atualizar empresa', getApiErrorMessage(error));
    }
  };

  if (companyQuery.isPending) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <ErrorState
        title="Erro ao carregar dados da empresa"
        error={companyQuery.error}
        onRetry={() => void companyQuery.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Empresa
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Mantenha os dados cadastrais e o endereço da sua organização atualizados.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-xl border border-zinc-950/[0.07] bg-white p-6 dark:border-white/[0.07] dark:bg-[#17171a]"
        noValidate
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-950/[0.07] pb-2 dark:border-white/[0.07]">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Informações gerais
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Nome da empresa"
              htmlFor="comp-name"
              required
              error={errors.name?.message}
              className="sm:col-span-2"
            >
              <TextInput
                id="comp-name"
                limit={255}
                type="text"
                {...register('name')}
              />
            </FormField>

            <FormField
              label="CNPJ / CPF"
              htmlFor="comp-document"
              error={errors.document_number?.message}
              hint={errors.document_number ? undefined : ''}
            >
              <Controller
                name="document_number"
                control={control}
                render={({ field }) => (
                  <TextInput
                    id="comp-document"
                    limit={18}
                    type="text"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    className={`${inputClassName(Boolean(errors.document_number))} font-mono tabular-nums`}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField label="Site" htmlFor="comp-website" error={errors.website?.message}>
              <TextInput
                id="comp-website"
                limit={512}
                type="url"
                placeholder="https://empresa.com.br"
                {...register('website')}
              />
            </FormField>

            <FormField
              label="Descrição"
              htmlFor="comp-desc"
              error={errors.description?.message}
              className="sm:col-span-2"
            >
              <TextArea
                id="comp-desc"
                limit={5000}
                rows={3}
                {...register('description')}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="border-b border-zinc-950/[0.07] pb-2 text-sm font-semibold text-zinc-900 dark:border-white/[0.07] dark:text-zinc-100">
            Endereço
          </h2>

          <div className="grid gap-4 sm:grid-cols-6">
            <FormField
              label="CEP"
              htmlFor="addr-zip"
              error={errors.address?.zip_code?.message}
              className="sm:col-span-2"
            >
              <Controller
                control={control}
                name="address.zip_code"
                render={({ field }) => (
                  <TextInput
                    id="addr-zip"
                    type="text"
                    inputMode="numeric"
                    placeholder="00000-000"
                    className={`${inputClassName(Boolean(errors.address?.zip_code))} font-mono tabular-nums`}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskZipCode(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Cidade"
              htmlFor="addr-city"
              error={errors.address?.city?.message}
              className="sm:col-span-3"
            >
              <TextInput
                id="addr-city"
                type="text"
                placeholder="São Paulo"
                {...register('address.city')}
              />
            </FormField>

            <FormField
              label="UF"
              htmlFor="addr-state"
              error={errors.address?.state?.message}
              className="sm:col-span-1"
            >
              <TextInput
                id="addr-state"
                type="text"
                limit={2}
                placeholder="SP"
                className={`${inputClassName(Boolean(errors.address?.state))} uppercase`}
                {...register('address.state')}
              />
            </FormField>
          </div>
        </div>

        <div className="flex border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07] sm:justify-end">
          <ActionButton
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </ActionButton>
        </div>
      </form>
    </div>
  );
}
