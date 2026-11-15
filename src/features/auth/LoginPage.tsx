import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { useTheme } from '@/src/theme/ThemeContext';
import { useToast } from '@/src/components/common/Toast';
import { FormField, inputClassName } from '@/src/components/common/FormField';
import { applyServerErrors, getApiErrorMessage } from '@/src/lib/formErrors';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Vértice CRM
        </span>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Acessar sua conta
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Entre com suas credenciais para gerenciar pipelines e leads da sua empresa.
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="E-mail" htmlFor="email" required error={errors.email?.message}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com.br"
                className={inputClassName(Boolean(errors.email))}
                {...register('email')}
              />
            </FormField>

            <FormField label="Senha" htmlFor="password" required error={errors.password?.message}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputClassName(Boolean(errors.password))}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Ambiente com seeder?</span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Preencher acesso demo
              </button>
            </div>
            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              Ainda não tem conta?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Cadastrar empresa
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
