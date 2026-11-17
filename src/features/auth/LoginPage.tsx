import Button from '@mui/material/Button';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { useToast } from '@/src/components/common/Toast';
import { FormField } from '@/src/components/common/FormField';
import { TextInput } from '@/src/components/common/TextInput';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values);
      toast.success('Login realizado com sucesso');
      navigate(from, { replace: true });
    } catch (error) {
      applyServerErrors(error, setError);
      const message = getApiErrorMessage(error, 'Não foi possível entrar.');
      setFormError(message);
      toast.error('Falha ao entrar', message);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'admin@example.com', { shouldValidate: true });
    setValue('password', 'password', { shouldValidate: true });
    setFormError(null);
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-2xl border border-zinc-950/[0.08] bg-white p-6 shadow-[var(--shadow-pop)] sm:p-8 dark:border-white/[0.08] dark:bg-[#17171a]">
        <div className="mb-6">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Acesso</p>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Entre com suas credenciais para gerenciar CRMs e leads da sua empresa.
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
            <FormField label="E-mail" htmlFor="email" required error={errors.email?.message}>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                hasError={Boolean(errors.email)}
                {...register('email')}
              />
            </FormField>

            <FormField label="Senha" htmlFor="password" required error={errors.password?.message}>
              <div className="relative">
                <TextInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  hasError={Boolean(errors.password)}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <Button variant="contained" color="inherit" disabled={isSubmitting} type="submit" className="w-full">
              <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 border-t border-zinc-950/[0.07] pt-5 dark:border-white/[0.07]">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Ambiente com seeder?</span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                Preencher acesso demo
              </button>
            </div>
            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Ainda não tem conta?{' '}
              <Link
                to="/register"
                className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-colors hover:decoration-zinc-900 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-100"
              >
                Cadastrar empresa
              </Link>
            </p>
          </div>
      </div>
    </AuthLayout>
  );
}
