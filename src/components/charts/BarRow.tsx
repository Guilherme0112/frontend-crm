import type { ReactNode } from 'react';
import { cn } from '@/src/lib/cn';

export interface BarRowSegment {
  value: number;
  /** Classes do preenchimento — use o mesmo gradiente dos gráficos vizinhos. */
  className: string;
}

/**
 * A linha de barra horizontal dos dashboards: rótulo, trilho e valor.
 *
 * Era markup repetido em "Leads por etapa" e "Leads por origem"; agora é um
 * lugar só, para os gráficos do funil não divergirem deles no primeiro ajuste.
 *
 * **Div com `overflow-hidden`, não SVG.** Um SVG com `viewBox` esticado deforma
 * o raio dos cantos — as pontas viram bicos. Aqui o arredondamento é do
 * trilho, então trecho empilhado e cauda herdam a forma certa de graça.
 */
export function BarRow({
  label,
  title,
  labelClassName,
  value,
  segments,
  tail,
  max,
  minPercent = 3,
}: {
  label: ReactNode;
  /** `title` do rótulo, para o nome truncado aparecer inteiro no hover. */
  title?: string;
  labelClassName?: string;
  value: ReactNode;
  /** Trechos na ordem de empilhamento. Um só = barra simples. */
  segments: BarRowSegment[];
  /** Desenhada por trás, mais clara: a cauda de um intervalo (p90). */
  tail?: BarRowSegment;
  /** Denominador comum da família de barras — nunca o valor da própria linha. */
  max: number;
  /** Piso em % para um valor pequeno porém real não sumir do trilho. */
  minPercent?: number;
}) {
  const safeMax = Math.max(1, max);
  const percent = (value_: number) =>
    value_ <= 0 ? 0 : Math.max(minPercent, Math.round((value_ / safeMax) * 100));

  return (
    /*
      Numa linha só a partir de `sm`; abaixo disso, duas: rótulo e valor em
      cima, barra ocupando a largura toda embaixo.

      Em três colunas num celular de 360px não cabe: rótulo e valor são
      `shrink-0` (truncar um número é pior que não mostrá-lo), e só o valor
      de "Tempo por etapa" já come 194px. O que sobrava para a barra era
      nada — e o excesso virava rolagem horizontal na página inteira.
    */
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:flex sm:gap-3">
      <span
        className={cn(
          'min-w-0 truncate text-[12px] font-medium text-zinc-700 sm:w-40 sm:shrink-0 dark:text-zinc-300',
          labelClassName,
        )}
        title={title}
      >
        {label}
      </span>

      {/* `order-last` + `col-span-2`: a barra desce para a segunda linha e
          ocupa as duas colunas; em `sm` volta a ser a coluna do meio. */}
      <div className="order-last col-span-2 w-full min-w-0 sm:order-none sm:col-span-1 sm:flex-1">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
          {/*
            A cauda vai do zero até o p90, por baixo da mediana — emendar uma na
            outra deixaria a costura à mostra, já que as opacidades diferem.
          */}
          {tail && tail.value > 0 && (
            <div
              className={cn('absolute inset-y-0 left-0 opacity-30', tail.className)}
              style={{ width: `${percent(tail.value)}%` }}
            />
          )}

          <div className="relative flex h-full">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={cn('h-full', segment.className)}
                style={{ width: `${percent(segment.value)}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <span className="shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
        {value}
      </span>
    </div>
  );
}
