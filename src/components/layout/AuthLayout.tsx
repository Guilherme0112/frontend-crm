import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Moon, Monitor, Sun } from 'lucide-react';
import { useTheme } from '@/src/theme/ThemeContext';
import { LogoMark } from '@/src/components/common/LogoMark';

const HIGHLIGHTS = [
  'CRMs multiempresa com Kanban, etapas e SLAs por coluna',
  'Cadência de envio com templates e métricas de conversão',
  'Faturas, assinaturas e equipe geridos no mesmo lugar',
];

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <div className="flex min-h-screen bg-[#fafaf9] text-zinc-900 dark:bg-[#101012] dark:text-zinc-100">
      {/* Brand panel */}
      <aside className="brand-panel relative hidden w-[46%] max-w-2xl flex-col justify-between overflow-hidden p-10 text-zinc-100 lg:flex xl:p-14">
        <Link to="/" className="flex w-fit items-center gap-3">
          <LogoMark className="h-10" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            SaldUp
            <span className="ml-1.5 font-normal text-zinc-400">CRM</span>
          </span>
        </Link>

        <div className="max-w-md">
          <p className="eyebrow text-blue-300/80">Plataforma comercial</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white xl:text-5xl">
            O CRM da sua empresa inteiro, em um lugar só.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-zinc-400">
            Do primeiro contato à fatura paga: capture leads, mova oportunidades no
            Kanban e acompanhe a saúde financeira — com a disciplina operacional que
            times comerciais de verdade precisam.
          </p>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" strokeWidth={2} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="max-w-md border-t border-white/10 pt-6">
          <blockquote className="text-sm leading-relaxed text-zinc-300">
            “Saímos de planilhas para um funil único em duas semanas. A taxa de
            conversão subiu e ninguém mais perde lead de vista.”
          </blockquote>
          <figcaption className="mt-3 text-xs font-medium text-zinc-500">
            Helena Prado · Diretora Comercial, Grupo Meridian
          </figcaption>
        </figure>
      </aside>

      {/* Form area */}
      <div className="app-canvas relative flex flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 lg:invisible">
            <LogoMark className="h-8" />
            <span className="font-display text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              SaldUp <span className="font-normal text-zinc-400 dark:text-zinc-500">CRM</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-950/[0.08] bg-white text-zinc-500 shadow-sm transition-colors hover:text-zinc-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-label={
              theme === 'light'
                ? 'Ativar modo escuro'
                : theme === 'dark'
                  ? 'Ativar modo sistema'
                  : 'Ativar modo claro'
            }
            title={
              theme === 'light'
                ? 'Modo escuro'
                : theme === 'dark'
                  ? 'Modo sistema'
                  : 'Modo claro'
            }
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : theme === 'dark' ? (
              <Monitor className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
