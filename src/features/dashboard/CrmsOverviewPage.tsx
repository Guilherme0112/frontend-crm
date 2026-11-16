import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Inbox,
  Megaphone,
  MapPin,
  MoveHorizontal,
  UsersRound,
} from 'lucide-react';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import { formatDate } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';
import { DeviceBreakdown } from './DeviceBreakdown';

const STEP_TINTS = [
  'bg-sky-500',
  'bg-blue-600',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

function StatTile({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-950/[0.07] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tint)}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
          {value}
        </p>
      </div>
    </div>
  );
}

const TOOLTIP_WIDTH = 240;

/**
 * Barra de funil com tooltip em portal.
 *
 * O tooltip precisa sair do fluxo da tabela: a tabela vive dentro de um
 * `overflow-x-auto`, e um contêiner com overflow em um eixo passa a recortar
 * o outro eixo também. Posicionado de forma absoluta ele era cortado (não
 * aparecia) e ainda inflava o scrollHeight da tabela, criando uma barra de
 * rolagem vertical fantasma dentro do card.
 */
function FunnelBar({ steps }: { steps: { position: number; name: string; leads: number }[] }) {
  const total = steps.reduce((acc, s) => acc + s.leads, 0);
  const label = steps.map((s) => `${s.name}: ${s.leads}`).join(' · ');
  const anchorRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ left: number; top: number; flipped: boolean } | null>(null);

  const open = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;

    const estimatedHeight = 56 + steps.length * 22;
    const flipped = rect.bottom + estimatedHeight + 16 > window.innerHeight;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, 8),
      window.innerWidth - TOOLTIP_WIDTH - 8,
    );

    setTip({ left, top: flipped ? rect.top - 8 : rect.bottom + 8, flipped });
  }, [steps.length]);

  const close = useCallback(() => setTip(null), []);

  return (
    <div
      ref={anchorRef}
      className="group/funnel relative flex w-full outline-none"
      tabIndex={0}
      role="button"
      aria-label={`Funil — ${total} leads. ${label}`}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {total === 0 ? (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Sem leads</span>
      ) : (
        <div className="flex h-3.5 w-full min-w-[120px] overflow-hidden rounded-full ring-offset-2 ring-offset-white transition-shadow group-hover/funnel:ring-2 group-hover/funnel:ring-zinc-900/20 group-focus-visible/funnel:ring-2 group-focus-visible/funnel:ring-blue-500 dark:ring-offset-[#17171a] dark:group-hover/funnel:ring-white/20">
          {steps.map((step) =>
            step.leads > 0 ? (
              <span
                key={step.position}
                className={cn('h-full', STEP_TINTS[step.position % STEP_TINTS.length])}
                style={{ width: `${(step.leads / total) * 100}%` }}
              />
            ) : null,
          )}
        </div>
      )}

      {tip &&
        createPortal(
          <div
            role="tooltip"
            style={{
              left: tip.left,
              top: tip.top,
              width: TOOLTIP_WIDTH,
              transform: tip.flipped ? 'translateY(-100%)' : undefined,
            }}
            className="pointer-events-none fixed z-[60] rounded-xl border border-zinc-950/[0.15] bg-zinc-950 p-3 text-zinc-100 shadow-[var(--shadow-pop)] dark:border-white/[0.12]"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Funil · {total} {total === 1 ? 'lead' : 'leads'}
            </p>
            {total === 0 ? (
              <p className="mt-2 text-[11px] text-zinc-400">Sem leads nas etapas.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {steps.map((step, index) => {
                  const pct = Math.round((step.leads / total) * 100);
                  return (
                    <li key={step.position} className="flex items-center gap-2 text-[11px]">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 shrink-0 rounded-[3px]',
                          STEP_TINTS[step.position % STEP_TINTS.length],
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate text-zinc-200">
                        {index + 1}. {step.name}
                      </span>
                      <span className="shrink-0 font-mono font-semibold tabular-nums text-zinc-100">
                        {step.leads}
                      </span>
                      <span className="w-9 shrink-0 text-right font-mono text-[10px] tabular-nums text-zinc-500">
                        {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function CrmsOverviewPage() {
  const comparisonQuery = useQuery({
    queryKey: queryKeys.reports.crmsComparison,
    queryFn: api.getCrmsComparison,
    retry: false,
  });

  const sourcesQuery = useQuery({
    queryKey: queryKeys.reports.leadSources,
    queryFn: api.getLeadSourcesReport,
    retry: false,
  });

  const comparison = comparisonQuery.data;
  const sources = sourcesQuery.data;

  const rows = comparison?.rows ?? [];
  const activeCrms = rows.filter((r) => r.leads_last_30_days > 0).length;
  const maxConsolidated = Math.max(1, ...(comparison?.sources_last_30_days ?? []).map((s) => s.leads));
  const sourceRows = sources?.rows ?? [];
  const maxSource = sourceRows.length > 0 ? Math.max(...sourceRows.map((r) => r.leads)) : 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Caminho" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
        <Link to="/crms" className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
          Todos os CRMs
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-600 dark:text-zinc-300">Dashboard geral</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Visão geral · 30 dias</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Todos os CRMs — número de verdade, lado a lado
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Consolidando {rows.length} {rows.length === 1 ? 'pipeline' : 'pipelines'}: volume de leads, movimentação, funil distribuído e de onde cada um vem.
          </p>
        </div>
        <Link
          to="/crms"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para CRMs
        </Link>
      </div>

      {/* Stat tiles */}
      <section aria-label="Resumo consolidado" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Leads (30 dias)',
            value: comparison ? String(comparison.totals.leads_last_30_days) : '—',
            icon: UsersRound,
            tint: 'bg-blue-50 text-blue-600 ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/15',
          },
          {
            label: 'Movimentos (30 dias)',
            value: comparison ? String(comparison.totals.step_changes_last_30_days) : '—',
            icon: MoveHorizontal,
            tint: 'bg-violet-50 text-violet-600 ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-400/15',
          },
          {
            label: 'CRMs com movimento',
            value: comparisonQuery.isPending ? '—' : String(activeCrms),
            icon: BarChart3,
            tint: 'bg-emerald-50 text-emerald-600 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/15',
          },
          {
            label: 'Leads com atribuição',
            value: sourcesQuery.isPending ? '—' : String(sources?.total_attributed_leads ?? 0),
            icon: MapPin,
            tint: 'bg-amber-50 text-amber-600 ring-amber-600/15 dark:bg-amber-950/50 dark:text-amber-400 dark:ring-amber-400/15',
          },
        ].map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </section>

      {comparisonQuery.isError && (
        <ErrorState
          title="Erro ao carregar o comparativo"
          error={comparisonQuery.error}
          onRetry={() => void comparisonQuery.refetch()}
        />
      )}

      {/* Consolidated sources */}
      {comparison?.sources_last_30_days && comparison.sources_last_30_days.length > 0 && (
        <section
          aria-labelledby="consolidated-sources-title"
          className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
        >
          <h2 id="consolidated-sources-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
            Fontes consolidadas (todos os CRMs · 30 dias)
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {comparison.sources_last_30_days.map((row) => {
              const pct = Math.round((row.leads / maxConsolidated) * 100);
              return (
                <div key={row.source} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
                  <span className="w-28 shrink-0 truncate font-mono text-[11px] font-semibold text-zinc-600 dark:text-zinc-300" title={row.source}>
                    {row.source}
                  </span>
                  <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                    {row.leads}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Dispositivos consolidados */}
      {comparison && (
        <DeviceBreakdown
          rows={comparison.devices_last_30_days}
          windowDays={comparison.window_days}
          title="Leads por dispositivo (todos os CRMs)"
        />
      )}

      {/* Comparison table */}
      <section
        aria-labelledby="crms-comparison-title"
        className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="border-b border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
          <h2 id="crms-comparison-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
            Comparativo por CRM
          </h2>
        </div>

        {comparisonQuery.isPending ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title="Nenhum CRM criado"
              description="Crie seus CRMs para ver a comparação aqui."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-950/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:border-white/[0.06] dark:text-zinc-500">
                  <th className="whitespace-nowrap px-5 py-3">CRM</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right">Etapas</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right">Leads totais</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right">Leads 30d</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right">Mov. 30d</th>
                  {/* w-full: esta coluna absorve a folga da tabela */}
                  <th className="w-full whitespace-nowrap px-5 py-3">Funil (distribuição)</th>
                  <th className="whitespace-nowrap px-5 py-3">Top origem (total)</th>
                  <th className="whitespace-nowrap px-5 py-3">Top origens (30d)</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                {rows.map((row) => (
                  <tr key={row.crm_id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ backgroundColor: row.color }}
                          aria-hidden="true"
                        />
                        <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                          {row.name}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                      {row.steps_count}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                      {row.leads_total}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                      {row.leads_last_30_days}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                      {row.step_changes_last_30_days}
                    </td>
                    <td className="px-5 py-3.5">
                      <FunnelBar steps={row.leads_by_step} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {row.top_source ? (
                        <code className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{row.top_source}</code>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5">
                      {row.sources_last_30_days.length === 0 ? (
                        <span className="text-zinc-400 dark:text-zinc-500">—</span>
                      ) : (
                        <span className="flex flex-nowrap gap-1">
                          {row.sources_last_30_days.map((s) => (
                            <span
                              key={s.source}
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300"
                              title={`${s.source}: ${s.leads}`}
                            >
                              {s.source}
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{s.leads}</span>
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <Link
                        to={`/crms/${row.crm_id}/dashboard`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Visão geral
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              {comparison?.totals && (
                <tfoot>
                  <tr className="border-t border-zinc-950/[0.07] bg-zinc-50 text-[13px] font-semibold dark:border-white/[0.07] dark:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                      Total · {rows.length} {rows.length === 1 ? 'pipeline' : 'pipelines'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-zinc-400 dark:text-zinc-500">—</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {comparison.totals.leads_total}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {comparison.totals.leads_last_30_days}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                      {comparison.totals.step_changes_last_30_days}
                    </td>
                    <td className="px-5 py-3" colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </section>

      {/* Fontes de leads */}
      <section
        aria-labelledby="sources-section-title"
        className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-violet-500" strokeWidth={1.8} />
            <h2 id="sources-section-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
              Fontes de leads (histórico)
            </h2>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
            {sourcesQuery.isPending ? '…' : `${sources?.total_attributed_leads ?? 0} com atribuição`}
          </span>
        </div>

        {sourcesQuery.isPending ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : sourcesQuery.isError ? (
          <div className="p-5">
            <ErrorState
              title="Erro ao carregar fontes"
              error={sourcesQuery.error}
              onRetry={() => void sourcesQuery.refetch()}
            />
          </div>
        ) : sourceRows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
            Nenhuma atribuição UTM registrada ainda. Leads capturados via API pública ou formulários com UTM vão aparecer aqui.
          </p>
        ) : (
          <div className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
            {sourceRows.map((row) => {
              const pct = Math.max(4, Math.round((row.leads / maxSource) * 100));
              return (
                <div key={row.source} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-48 shrink-0 truncate font-mono text-[12px] font-semibold text-zinc-800 dark:text-zinc-100" title={row.source}>
                    {row.source}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                    {row.leads}
                  </span>
                  <span className="hidden w-28 shrink-0 text-right font-mono text-[10px] tabular-nums text-zinc-400 sm:inline dark:text-zinc-500">
                    {formatDate(row.last_captured_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-right text-[10px] text-zinc-400 dark:text-zinc-500">
        Janela de {comparison?.window_days ?? 30} dias para KPIs e comparativos · fontes de leads em histórico completo
      </p>
    </div>
  );
}
