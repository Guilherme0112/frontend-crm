import { Link } from 'react-router-dom';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/src/auth/AuthContext';
import { useTheme } from '@/src/theme/ThemeContext';
import { getInitials } from '@/src/lib/format';
import { StatusIndicator } from '@/src/components/common/StatusBadge';
import { cn } from '@/src/lib/cn';

const THEMES = [
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Escuro', icon: Moon },
  { id: 'system', label: 'Sistema', icon: Monitor },
] as const;

export function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Meu Perfil
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Seus dados e preferências de exibição.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-6 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-base font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {user?.name || '—'}
            </h2>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {user?.email || '—'}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Status</dt>
            <dd>
              <StatusIndicator
                tone={user?.is_active ? 'success' : 'neutral'}
                label={user?.is_active ? 'Ativo' : 'Inativo'}
              />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-zinc-500 dark:text-zinc-400">Telefone</dt>
            <dd className="font-mono tabular-nums text-sm text-zinc-900 dark:text-zinc-100">
              {user?.phone || 'Não informado'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-zinc-950/[0.07] pt-5 dark:border-white/[0.07]">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Aparência</h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {THEMES.map((item) => {
              const Icon = item.icon;
              const isActive = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-zinc-950/[0.07] text-zinc-600 hover:bg-zinc-50 dark:border-white/[0.07] dark:text-zinc-400 dark:hover:bg-white/[0.04]',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-950/[0.07] pt-4 text-sm font-medium text-blue-600 dark:border-white/[0.07] dark:text-blue-400">
          <Link to="/company" className="hover:underline">
            Editar empresa
          </Link>
          <Link to="/team" className="hover:underline">
            Gerenciar equipe
          </Link>
        </div>
      </section>
    </div>
  );
}
