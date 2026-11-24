import Button from '@mui/material/Button';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { useToast } from '@/src/components/common/Toast';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';
import { isValidCpfOrCnpjDigits, maskCpfCnpj, onlyDigits } from '@/src/lib/format';

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
    name: z.string().trim().min(2, 'Informe seu nome completo'),
    email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    password_confirmation: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function StepHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

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
      name: '',
      email: '',
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
        name: values.name.trim(),
        email: values.email.trim(),
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
      <div className="w-full max-w-xl rounded-2xl border border-zinc-950/[0.08] bg-white p-6 shadow-[var(--shadow-pop)] sm:p-8 dark:border-white/[0.08] dark:bg-[#17171a]">
        <div className="mb-7">
          <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Cadastro</p>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Criar conta empresarial
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Apenas os dados essenciais para começar em menos de um minuto.
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
          <section className="space-y-4">
            <StepHeader
              step="1"
              title="Dados da empresa"
              description="Como sua empresa aparece no sistema."
            />
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <FormField
                label="Nome da empresa"
                htmlFor="company_name"
                required
                dense
                error={errors.company_name?.message}
                className="sm:col-span-2"
              >
                <TextInput
                  id="company_name"
                  type="text"
                  placeholder="Ex.: Minha Empresa Ltda"
                  hasError={Boolean(errors.company_name)}
                  {...register('company_name')}
                />
              </FormField>

              <FormField
                label="CPF ou CNPJ"
                htmlFor="company_document"
                hint="Opcional · 11 ou 14 dígitos"
                dense
                error={errors.company_document?.message}
                className="sm:col-span-2"
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
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-950/[0.07] pt-7 dark:border-white/[0.07]">
            <StepHeader
              step="2"
              title="Administrador da conta"
              description="Quem vai gerenciar esta empresa."
            />
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <FormField
                label="Nome completo"
                htmlFor="name"
                required
                dense
                error={errors.name?.message}
                className="sm:col-span-2"
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
                label="E-mail"
                htmlFor="email"
                required
                dense
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
                dense
                error={errors.password?.message}
              >
                <TextInput
                  id="password"
                  passwordToggle
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
                dense
                error={errors.password_confirmation?.message}
              >
                <TextInput
                  id="password_confirmation"
                  passwordToggle
                  autoComplete="new-password"
                  placeholder="••••••••"
                  hasError={Boolean(errors.password_confirmation)}
                  {...register('password_confirmation')}
                />
              </FormField>
            </div>
          </section>

          <Button
            variant="contained"
            color="inherit"
            disabled={isSubmitting}
            type="submit"
            sx={{ minHeight: 46, mt: 1 }}
            className="w-full"
          >
            <span>{isSubmitting ? 'Criando conta...' : 'Criar conta e acessar'}</span>
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-7 border-t border-zinc-950/[0.07] pt-5 dark:border-white/[0.07]">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Já possui uma conta?{' '}
            <Link
              to="/login"
              className="ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/[0.06]"
            >
              Fazer login <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
