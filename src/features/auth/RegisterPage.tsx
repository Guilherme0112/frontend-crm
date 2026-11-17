import Button from '@mui/material/Button';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { useToast } from '@/src/components/common/Toast';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import {
  PHONE_REGEX,
  isValidCpfOrCnpjDigits,
  maskCpfCnpj,
  maskPhone,
  onlyDigits,
} from '@/src/lib/format';

const registerSchema = z
  .object({
    company_name: z.string().trim().min(2, 'Informe o nome da empresa'),
    company_document: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || isValidCpfOrCnpjDigits(val), {
        message: 'Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)',
      }),
    company_website: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^https?:\/\/.+/.test(val), {
        message: 'Informe uma URL válida iniciando com http:// ou https://',
      }),
    name: z.string().trim().min(2, 'Informe seu nome completo'),
    email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
    phone: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || PHONE_REGEX.test(val), {
        message: 'Use o formato (00) 00000-0000',
      }),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    password_confirmation: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { isAuthenticated, register: registerAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: '',
      company_document: '',
      company_website: '',
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    try {
      const docDigits = values.company_document ? onlyDigits(values.company_document) : '';
      await registerAccount({
        company_name: values.company_name.trim(),
        company_document: docDigits || null,
        company_website: values.company_website?.trim() || null,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      toast.success('Empresa cadastrada com sucesso');
      navigate('/', { replace: true });
    } catch (error) {
      applyServerErrors(error, setError);
      const message = getApiErrorMessage(error, 'Não foi possível concluir o cadastro.');
      setFormError(message);
      toast.error('Erro no cadastro', message);
    }
  };

  return (
    <AuthLayout>
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-950/[0.08] bg-white p-6 shadow-[var(--shadow-pop)] sm:p-8 dark:border-white/[0.08] dark:bg-[#17171a]">
          <div className="mb-6">
            <p className="eyebrow text-zinc-400 dark:text-zinc-500">Cadastro</p>
            <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Criar conta empresarial
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Configure sua empresa e o usuário administrador inicial em poucos passos.
            </p>
          </div>

          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="space-y-6">
              <h2 className="eyebrow border-b border-zinc-950/[0.07] pb-2.5 text-zinc-400 dark:border-white/[0.07] dark:text-zinc-500">
                Dados da empresa
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  label="Nome da empresa"
                  htmlFor="company_name"
                  required
                  error={errors.company_name?.message}
                  className="sm:col-span-2"
                >
                  <TextInput
                    id="company_name"
                    type="text"
                    placeholder="Ex.: Acme Brasil Ltda"
                    hasError={Boolean(errors.company_name)}
                    {...register('company_name')}
                  />
                </FormField>

                <FormField
                  label="CPF ou CNPJ"
                  htmlFor="company_document"
                  hint="Opcional · 11 ou 14 dígitos"
                  error={errors.company_document?.message}
                >
                  <Controller
                    control={control}
                    name="company_document"
                    render={({ field }) => (
                      <TextInput
                        id="company_document"
                        type="text"
                        inputMode="numeric"
                        placeholder="00.000.000/0000-00"
                        hasError={Boolean(errors.company_document)}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(maskCpfCnpj(e.target.value))}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </FormField>

                <FormField
                  label="Site da empresa"
                  htmlFor="company_website"
                  error={errors.company_website?.message}
                >
                  <TextInput
                    id="company_website"
                    type="url"
                    placeholder="https://suaempresa.com.br"
                    hasError={Boolean(errors.company_website)}
                    {...register('company_website')}
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="eyebrow border-b border-zinc-950/[0.07] pb-2.5 text-zinc-400 dark:border-white/[0.07] dark:text-zinc-500">
                Administrador da conta
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  label="Nome completo"
                  htmlFor="name"
                  required
                  error={errors.name?.message}
                >
                  <TextInput
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ana Souza"
                    hasError={Boolean(errors.name)}
                    {...register('name')}
                  />
                </FormField>

                <FormField
                  label="Telefone"
                  htmlFor="phone"
                  error={errors.phone?.message}
                >
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <TextInput
                        id="phone"
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

                <FormField
                  label="E-mail"
                  htmlFor="email"
                  required
                  error={errors.email?.message}
                  className="sm:col-span-2"
                >
                  <TextInput
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ana@suaempresa.com.br"
                    hasError={Boolean(errors.email)}
                    {...register('email')}
                  />
                </FormField>

                <FormField
                  label="Senha"
                  htmlFor="password"
                  hint="Mínimo de 8 caracteres"
                  required
                  error={errors.password?.message}
                >
                  <TextInput
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    hasError={Boolean(errors.password)}
                    {...register('password')}
                  />
                </FormField>

                <FormField
                  label="Confirmar senha"
                  htmlFor="password_confirmation"
                  required
                  error={errors.password_confirmation?.message}
                >
                  <TextInput
                    id="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    hasError={Boolean(errors.password_confirmation)}
                    {...register('password_confirmation')}
                  />
                </FormField>
              </div>
            </div>

            <Button variant="contained" color="inherit" disabled={isSubmitting} type="submit" className="w-full">
              <span>{isSubmitting ? 'Criando conta...' : 'Criar conta e acessar'}</span>
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 border-t border-zinc-950/[0.07] pt-5 text-center text-sm text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-100"
            >
              Fazer login
            </Link>
          </p>
        </div>
    </AuthLayout>
  );
}
