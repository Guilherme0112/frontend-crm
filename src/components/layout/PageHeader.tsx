import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/src/lib/cn';

/** Um degrau do caminho até esta página. Sem `to`, é o degrau atual. */
export interface PageTrailStep {
  to?: string;
  label: string;
}

export interface PageHeaderProps {
  /**
   * Caminho até aqui. **Um** degrau vira o link "← Voltar"; **dois ou mais**
   * viram a trilha completa.
   *
   * A escolha é pelo dado, não pelo chamador: duas formas de pedir a mesma
   * coisa era exatamente o que fazia cada página inventar a sua.
   */
  trail?: PageTrailStep[];
  /** Rótulo curto acima do título ("Operação", "Comunicação"). */
  eyebrow?: string;
  /**
   * Marca visual à esquerda do título — a cor do CRM, por exemplo.
   *
   * Fica **na linha do título**, não numa coluna própria: o selo de 48px que
   * o dashboard do pipeline usava empurrava o texto e dava a duas telas do
   * mesmo CRM dois cabeçalhos diferentes.
   */
  icon?: ReactNode;
  title: ReactNode;
  /** Renderizado na mesma linha do título — chip de status, contador. */
  titleAfter?: ReactNode;
  description?: ReactNode;
  /** Botões do canto direito. Empilham no celular, alinham a partir de `sm`. */
  actions?: ReactNode;
}

/**
 * O cabeçalho de toda página do app.
 *
 * Antes cada tela repetia o próprio: umas com `text-zinc-950`, outras com
 * `text-zinc-900`; o espaçamento acima do `<h1>` variava entre `mt-0.5`,
 * `mt-1.5`, `mt-2`, `mt-3` e nenhum; metade tinha eyebrow e metade não. Nada
 * disso era decisão — era deriva. Aqui existe um lugar só para mudar.
 *
 * O `<h1>` é um por página: o `AppLayout` não emite outro, então o leitor de
 * tela encontra exatamente um título de nível 1 em cada rota.
 *
 * Fora do padrão de propósito: `LoginPage` e `RegisterPage`, que não são telas
 * do app — são cartões centrados, sem navegação nem ações.
 */
export function PageHeader({
  trail,
  eyebrow,
  icon,
  title,
  titleAfter,
  description,
  actions,
}: PageHeaderProps) {
  const hasTrail = trail !== undefined && trail.length > 0;

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {hasTrail && <Trail steps={trail} />}

        {eyebrow && (
          <p className={cn('eyebrow text-zinc-400 dark:text-zinc-500', hasTrail && 'mt-2')}>
            {eyebrow}
          </p>
        )}

        <div className={cn('flex min-w-0 items-center gap-3', (hasTrail || eyebrow) && 'mt-1.5')}>
          {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
          <h1 className="min-w-0 break-words font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          {titleAfter}
        </div>

        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        /*
          `items-stretch` no celular para os botões ocuparem a largura toda:
          num cabeçalho com dois botões lado a lado a 360px, cada um fica com
          alvo de toque estreito demais.
        */
        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          {actions}
        </div>
      )}
    </header>
  );
}

function Trail({ steps }: { steps: PageTrailStep[] }) {
  // Um degrau só: seta de voltar, que é o que a tela realmente oferece.
  if (steps.length === 1) {
    const [step] = steps;

    if (!step.to) {
      return null;
    }

    return (
      <Link
        to={step.to}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {step.label}
      </Link>
    );
  }

  return (
    <nav
      aria-label="Caminho"
      className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500"
    >
      {steps.map((step, index) => (
        <span key={`${step.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span aria-hidden="true">/</span>}
          {step.to ? (
            <Link
              to={step.to}
              className="max-w-[12rem] truncate transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {step.label}
            </Link>
          ) : (
            /* Degrau atual: texto, não link — clicar levaria à própria página. */
            <span className="max-w-[12rem] truncate text-zinc-600 dark:text-zinc-300">
              {step.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
