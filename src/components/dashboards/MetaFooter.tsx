import { Clock, Globe, Users } from 'lucide-react';
import type { DashboardMeta } from '@/src/lib/types';

/**
 * Rodapé que todo dashboard mostra: janela, fuso, denominador e cobertura.
 *
 * Sem ele, dois números iguais em telas diferentes parecem comparáveis quando
 * não são — a cobertura de origem do D3 olha a janela, a do D6 olha a base
 * inteira. Dizer o recorte ao pé da tela é o que evita essa leitura errada.
 */
export function MetaFooter({ meta }: { meta: DashboardMeta }) {
  const generated = new Date(meta.generated_at).toLocaleString('pt-BR', {
    timeZone: meta.company_timezone,
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <footer className="mt-6 flex flex-col gap-2 border-t border-zinc-950/[0.07] pt-4 text-[11px] text-zinc-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 dark:border-white/[0.07] dark:text-zinc-500">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3 w-3 shrink-0" />
        {meta.window.days === 1
          ? `Dia ${formatDay(meta.window.from)}`
          : `${formatDay(meta.window.from)} a ${formatDay(meta.window.to)} (${meta.window.days} dias)`}
      </span>

      <span className="inline-flex items-center gap-1.5">
        <Globe className="h-3 w-3 shrink-0" />
        {meta.company_timezone}
      </span>

      {meta.denominator && (
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3 w-3 shrink-0" />
          {meta.denominator.label}: <strong className="tabular-nums">{meta.denominator.n}</strong>
        </span>
      )}

      <span className="text-zinc-400 dark:text-zinc-600">Gerado em {generated}</span>
    </footer>
  );
}

/** `2026-11-26` → `26/11`. Data local da API, sem passar por `new Date()`. */
function formatDay(isoDay: string): string {
  // `new Date('2026-11-26')` seria interpretado como UTC e voltaria um dia em
  // fusos negativos — a data aqui já é local, então a conversão é textual.
  const [, month, day] = isoDay.split('-');

  return `${day}/${month}`;
}
