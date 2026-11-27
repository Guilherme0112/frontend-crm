import { cn } from '@/src/lib/cn';
import type { RatioMetric } from '@/src/lib/types';

/**
 * O **único** componente que renderiza uma razão.
 *
 * Nenhuma tela formata percentual por conta própria, e a razão é o primeiro
 * princípio da spec: todo número vem com denominador. Quando a API marca
 * `suppressed`, não existe percentual a mostrar — a amostra é pequena demais
 * para o número significar alguma coisa, e "100% de conversão" com n = 1 é
 * ruído apresentado como fato.
 */
export function RatioValue({
  metric,
  className,
  showSample = true,
  invertTone = false,
  compact = false,
}: {
  metric: RatioMetric | null | undefined;
  className?: string;
  showSample?: boolean;
  /**
   * Em célula estreita, a supressão vira um travessão com o motivo no
   * `title`. "Amostra insuficiente" por extenso quebra em duas linhas e
   * desalinha a tabela inteira — e ao lado dos números brutos (`9/17`) o
   * travessão já se lê como "sem taxa", não como "sem dado".
   */
  compact?: boolean;
  /** Em taxa de falha, mais alto é pior: inverte a cor sem inverter o número. */
  invertTone?: boolean;
}) {
  if (!metric || metric.suppressed || metric.value === null) {
    if (compact) {
      return (
        <span
          title={`Amostra insuficiente (n = ${metric?.n ?? 0})`}
          className={cn('text-sm text-zinc-400 dark:text-zinc-500', className)}
        >
          —
        </span>
      );
    }

    return (
      <span className={cn('text-sm text-zinc-500 dark:text-zinc-400', className)}>
        Amostra insuficiente
        {showSample && <span className="ml-1 font-mono text-xs tabular-nums">(n = {metric?.n ?? 0})</span>}
      </span>
    );
  }

  const percent = (metric.value * 100).toFixed(1).replace('.', ',');
  const high = metric.value >= 0.5;
  const good = invertTone ? !high : high;

  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          good
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-zinc-900 dark:text-zinc-100',
        )}
      >
        {percent}%
      </span>
      {showSample && (
        <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
          n = {metric.n}
        </span>
      )}
    </span>
  );
}
