import { useState } from 'react';
import { Laptop, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/src/lib/cn';

export interface DeviceRow {
  device: string;
  leads: number;
}

/**
 * Distribuição de leads por dispositivo — barra empilhada horizontal.
 *
 * Forma escolhida por ser parte-de-um-todo com poucas categorias de nome longo.
 * Cores categóricas em ordem fixa por ENTIDADE (mobile sempre azul), nunca por
 * posição no ranking: filtrar ou reordenar não pode repintar as fatias.
 *
 * Paleta validada nos dois temas contra as superfícies reais do app
 * (#ffffff / #17171a), incluindo separação para daltonismo.
 */

/** Slots categóricos validados: [claro, escuro]. */
const SLOTS: ReadonlyArray<readonly [string, string]> = [
  ['#2a78d6', '#3987e5'], // 1 azul
  ['#eb6834', '#d95926'], // 2 laranja
  ['#1baf7a', '#199e70'], // 3 aqua
  ['#eda100', '#c98500'], // 4 amarelo
  ['#e87ba4', '#d55181'], // 5 magenta
  ['#4a3aa7', '#9085e9'], // 6 violeta
];

/**
 * Ausência de dado não é uma categoria de dispositivo: cinza de de-emphasis.
 * Tons escolhidos por medição — separam de aqua/laranja/azul em CVD e visão
 * normal. Ficam fora da faixa de luminosidade e do piso de croma das séries
 * de propósito: cinza não é uma série.
 */
const UNKNOWN_TINT = ['#6f6d66', '#b8b6ad'] as const;

const KNOWN: Record<string, { label: string; slot: number; icon: typeof Smartphone }> = {
  mobile: { label: 'Celular', slot: 0, icon: Smartphone },
  desktop: { label: 'Computador', slot: 1, icon: Monitor },
  tablet: { label: 'Tablet', slot: 2, icon: Tablet },
};

/** Abreviações do ValueTrack do Google Ads. */
const ALIASES: Record<string, string> = { m: 'mobile', c: 'desktop', t: 'tablet' };

function isUnknown(device: string): boolean {
  return device === '(não informado)' || device.trim() === '';
}

interface Resolved {
  key: string;
  label: string;
  leads: number;
  pct: number;
  light: string;
  dark: string;
  icon: typeof Smartphone;
}

/**
 * Ordem fixa das fatias: conhecidos primeiro na ordem canônica, depois os
 * extras por volume, e "não informado" sempre por último. Ordenar por volume
 * faria a barra se reorganizar entre um CRM e outro, impedindo comparação.
 */
function order(rows: DeviceRow[]): DeviceRow[] {
  const rank = (row: DeviceRow): number => {
    if (isUnknown(row.device)) return 100;
    const normalized = ALIASES[row.device.toLowerCase()] ?? row.device.toLowerCase();

    return KNOWN[normalized] ? KNOWN[normalized].slot : 50;
  };

  return [...rows].sort((a, b) => rank(a) - rank(b) || b.leads - a.leads);
}

function resolve(rows: DeviceRow[], total: number): Resolved[] {
  let nextExtraSlot = 3;

  return order(rows).map((row) => {
    const normalized = ALIASES[row.device.toLowerCase()] ?? row.device.toLowerCase();
    const known = KNOWN[normalized];
    const pct = total > 0 ? (row.leads / total) * 100 : 0;

    if (isUnknown(row.device)) {
      return {
        key: row.device,
        label: 'Não informado',
        leads: row.leads,
        pct,
        light: UNKNOWN_TINT[0],
        dark: UNKNOWN_TINT[1],
        icon: Laptop,
      };
    }

    // Valores fora dos três conhecidos pegam os próximos slots, sem gerar
    // cores novas; esgotados os slots, caem no cinza.
    const slot = known ? known.slot : nextExtraSlot++;
    const tint = SLOTS[slot] ?? UNKNOWN_TINT;

    return {
      key: row.device,
      label: known?.label ?? row.device,
      leads: row.leads,
      pct,
      light: tint[0],
      dark: tint[1],
      icon: known?.icon ?? Laptop,
    };
  });
}

export function DeviceBreakdown({
  rows,
  windowDays,
  title = 'Leads por dispositivo',
}: {
  rows: DeviceRow[];
  windowDays: number;
  title?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const total = rows.reduce((acc, r) => acc + r.leads, 0);
  const items = resolve(rows, total);

  return (
    <section
      aria-labelledby="device-breakdown-title"
      className="device-viz rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="device-breakdown-title"
          className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200"
        >
          {title}
        </h2>
        <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
          {total} {total === 1 ? 'lead atribuído' : 'leads atribuídos'} · {windowDays} dias
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Nenhum lead com origem registrada nesta janela. O dispositivo chega junto com os
          leads capturados pela integração pública.
        </p>
      ) : (
        <>
          {/* Barra empilhada. O gap de 2px deixa a superfície do card separar as
              fatias — separação por espaço, não por contorno. */}
          <div className="relative mt-4">
            <div className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full">
              {items.map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    'device-seg h-full transition-opacity',
                    hovered !== null && hovered !== item.key && 'opacity-40',
                  )}
                  style={
                    {
                      width: `${item.pct}%`,
                      '--seg-light': item.light,
                      '--seg-dark': item.dark,
                    } as React.CSSProperties
                  }
                  onMouseEnter={() => setHovered(item.key)}
                  onMouseLeave={() => setHovered(null)}
                  role="img"
                  title={`${item.label}: ${item.leads} leads (${item.pct.toFixed(1)}%)`}
                  aria-label={`${item.label}: ${item.leads} leads, ${item.pct.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>

          {/* Legenda com rótulo direto: identidade nunca depende só da cor,
              e cobre a regra de alívio do aqua em tema claro. */}
          <ul className="mt-4 grid gap-x-5 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.key}
                  className={cn(
                    'flex items-center gap-2 transition-opacity',
                    hovered !== null && hovered !== item.key && 'opacity-40',
                  )}
                  onMouseEnter={() => setHovered(item.key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span
                    className="device-swatch h-2.5 w-2.5 shrink-0 rounded-[3px]"
                    style={
                      {
                        '--seg-light': item.light,
                        '--seg-dark': item.dark,
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-600 dark:text-zinc-300">
                    {item.label}
                  </span>
                  <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {item.leads}
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                    {item.pct.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
