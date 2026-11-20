import Button from '@mui/material/Button';
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
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

  return (
    <AuthLayout>
      <div className="w-full max-w-[400px] rounded-2xl border border-zinc-950/[0.08] bg-white p-6 shadow-[var(--shadow-pop)] sm:p-8 dark:border-white/[0.08] dark:bg-[#17171a]">
        <div className="mb-7">
          <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Acesso</p>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Bem-vindo de volta
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Use seu e-mail e senha para continuar.
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
          <FormField label="E-mail" htmlFor="email" required dense error={errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com.br"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>

          <FormField label="Senha" htmlFor="password" required dense error={errors.password?.message}>
            <div className="relative">
              <TextInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                hasError={Boolean(errors.password)}
                slotProps={{ htmlInput: { style: { paddingRight: 40 } } }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-100"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>

          <Button
            variant="contained"
            color="inherit"
            disabled={isSubmitting}
            type="submit"
            sx={{ minHeight: 46, mt: 1 }}
            className="w-full"
          >
            <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-7 border-t border-zinc-950/[0.07] pt-5 dark:border-white/[0.07]">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Ainda não tem conta?{' '}
            <Link
              to="/register"
              className="ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-white/[0.06]"
            >
              Cadastrar empresa <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
