import Button from '@mui/material/Button';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/src/auth/AuthContext';
import { useCompanyQuery, useUpdateCompanyMutation } from './hooks';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { TextArea } from '@/src/components/common/TextArea';
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
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || val.length === 2, {
        message: 'UF deve ter 2 letras (ex.: SP)',
      }),
    country: z.string().optional(),
    ibge_code: z.string().optional(),
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
      address: {
        zip_code: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        country: 'Brasil',
        ibge_code: '',
      },
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
          street: c.address?.street ?? '',
          number: c.address?.number ?? '',
          complement: c.address?.complement ?? '',
          neighborhood: c.address?.neighborhood ?? '',
          city: c.address?.city ?? '',
          state: c.address?.state ?? '',
          country: c.address?.country ?? 'Brasil',
          ibge_code: c.address?.ibge_code ?? '',
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
              street: addr.street?.trim() || null,
              number: addr.number?.trim() || null,
              complement: addr.complement?.trim() || null,
              neighborhood: addr.neighborhood?.trim() || null,
              city: addr.city?.trim() || null,
              state: addr.state?.trim().toUpperCase() || null,
              country: addr.country?.trim() || null,
              ibge_code: addr.ibge_code?.trim() || null,
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
      <div className="w-full space-y-6">
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
    <div className="w-full space-y-6">
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-950/[0.07] pb-2 dark:border-white/[0.07]">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Informações gerais
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Nome da empresa"
              htmlFor="comp-name"
              required
              error={errors.name?.message}
              className="sm:col-span-2"
            >
              <TextInput
                id="comp-name"
                type="text"
                hasError={Boolean(errors.name)}
                {...register('name')}
              />
            </FormField>

            <FormField
              label="CNPJ / CPF"
              htmlFor="comp-document"
              error={errors.document_number?.message}
              hint={errors.document_number ? undefined : 'Opcional · máscara automática'}
            >
              <Controller
                name="document_number"
                control={control}
                render={({ field }) => (
                  <TextInput
                    id="comp-document"
                    type="text"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    hasError={Boolean(errors.document_number)} className="font-mono tabular-nums"
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
                type="url"
                placeholder="https://empresa.com.br"
                hasError={Boolean(errors.website)}
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
                hasError={Boolean(errors.description)}
                {...register('description')}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-6">
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
                    hasError={Boolean(errors.address?.zip_code)} className="font-mono tabular-nums"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(maskZipCode(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <FormField
              label="Logradouro"
              htmlFor="addr-street"
              error={errors.address?.street?.message}
              className="sm:col-span-3"
            >
              <TextInput
                id="addr-street"
                type="text"
                placeholder="Av. Paulista"
                hasError={Boolean(errors.address?.street)}
                {...register('address.street')}
              />
            </FormField>

            <FormField
              label="Número"
              htmlFor="addr-number"
              error={errors.address?.number?.message}
              className="sm:col-span-1"
            >
              <TextInput
                id="addr-number"
                type="text"
                placeholder="1000"
                hasError={Boolean(errors.address?.number)}
                {...register('address.number')}
              />
            </FormField>

            <FormField
              label="Complemento"
              htmlFor="addr-comp"
              error={errors.address?.complement?.message}
              className="sm:col-span-3"
            >
              <TextInput
                id="addr-comp"
                type="text"
                placeholder="Sala 12"
                hasError={Boolean(errors.address?.complement)}
                {...register('address.complement')}
              />
            </FormField>

            <FormField
              label="Bairro"
              htmlFor="addr-neigh"
              error={errors.address?.neighborhood?.message}
              className="sm:col-span-3"
            >
              <TextInput
                id="addr-neigh"
                type="text"
                placeholder="Bela Vista"
                hasError={Boolean(errors.address?.neighborhood)}
                {...register('address.neighborhood')}
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
                hasError={Boolean(errors.address?.city)}
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
                maxLength={2}
                placeholder="SP"
                hasError={Boolean(errors.address?.state)} className="uppercase"
                {...register('address.state')}
              />
            </FormField>

            <FormField
              label="País"
              htmlFor="addr-country"
              error={errors.address?.country?.message}
              className="sm:col-span-2"
            >
              <TextInput
                id="addr-country"
                type="text"
                placeholder="Brasil"
                hasError={Boolean(errors.address?.country)}
                {...register('address.country')}
              />
            </FormField>

            <FormField
              label="Código IBGE"
              htmlFor="addr-ibge"
              error={errors.address?.ibge_code?.message}
              className="sm:col-span-2"
            >
              <TextInput
                id="addr-ibge"
                type="text"
                placeholder="3550308"
                hasError={Boolean(errors.address?.ibge_code)} className="font-mono tabular-nums"
                {...register('address.ibge_code')}
              />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
          <Button variant="contained" disabled={updateMutation.isPending || !isDirty} type="submit">
            {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
