import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  Timer,
  UsersRound,
} from 'lucide-react';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { useCrmQuery } from '@/src/features/crm/hooks';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { formatDate, formatDuration } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  tint: string;
  hint?: string;
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
        {hint && <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">{hint}</p>}
      </div>
    </div>
  );
}

export function CrmDashboardPage() {
  const { id } = useParams();
  const crmId = Number(id);

  const crmQuery = useCrmQuery(crmId);
  const dashboardQuery = useQuery({
    queryKey: queryKeys.reports.crmDashboard(crmId),
    queryFn: () => api.getCrmDashboard(crmId),
    enabled: Number.isFinite(crmId) && crmId > 0,
    retry: false,
  });

  if (crmQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (crmQuery.isError || !crmQuery.data) {
    return (
      <div className="space-y-4">
        <Link
          to="/crms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para CRMs</span>
        </Link>
        <ErrorState
          title="CRM não encontrado"
          error={crmQuery.error}
          onRetry={() => void crmQuery.refetch()}
        />
      </div>
    );
  }

  const crm = crmQuery.data;

  if (dashboardQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="space-y-4">
        <Link
          to={`/crms/${crm.id}/board`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao quadro</span>
        </Link>
        <ErrorState
          title="Erro ao carregar relatório do CRM"
          error={dashboardQuery.error}
          onRetry={() => void dashboardQuery.refetch()}
        />
      </div>
    );
  }

  const data = dashboardQuery.data;
  const maxStepLeads = Math.max(1, ...data.leads_by_step.map((s) => s.leads));
  const maxSourceLeads = Math.max(1, ...data.leads_by_source_last_30_days.map((s) => s.leads));
  const maxDwellStep = Math.max(0, ...data.avg_dwell_per_step.map((s) => s.avg_seconds ?? 0));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Caminho" className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
        <Link to="/crms" className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
          Todos os CRMs
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/crms/${crm.id}/board`}
          className="max-w-40 truncate transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {crm.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-600 dark:text-zinc-300">Visão geral</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${crm.color}1f`, color: crm.color }}
            aria-hidden="true"
          >
            <BarChart3 className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p className="eyebrow text-zinc-400 dark:text-zinc-500">Relatório de 30 dias</p>
            <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {crm.name} — Visão geral
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Métricas dos últimos {data.window_days} dias e distribuição atual dos leads por etapa.
            </p>
          </div>
        </div>
        <Link
          to={`/crms/${crm.id}/board`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao quadro
        </Link>
      </div>

      {/* Stat tiles */}
      <section aria-label="Indicadores dos últimos 30 dias" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Leads no total"
          value={String(data.leads_total)}
          icon={UsersRound}
          tint="bg-blue-50 text-blue-600 ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/15"
        />
        <StatCard
          label="Leads (30 dias)"
          value={String(data.leads_last_30_days)}
          icon={BarChart3}
          tint="bg-violet-50 text-violet-600 ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-400/15"
          hint={`nos últimos ${data.window_days} dias`}
        />
        <StatCard
          label="Permanência média"
          value={formatDuration(data.general_avg_dwell_seconds)}
          icon={Timer}
          tint="bg-emerald-50 text-emerald-600 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/15"
          hint={`${data.dwell_observations} observações`}
        />
      </section>

      {/* Tempo médio por etapa */}
      <section
        aria-labelledby="dwell-title"
        className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="dwell-title" className="flex items-center gap-2 font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
            <Timer className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
            Tempo médio em cada etapa
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
            {data.dwell_observations} {data.dwell_observations === 1 ? 'observação' : 'observações'}
          </span>
        </div>

        <ol className="mt-4 space-y-2.5">
          {data.avg_dwell_per_step.map((step) => {
            const pct =
              step.avg_seconds !== null && step.avg_seconds !== undefined
                ? Math.max(4, Math.round((step.avg_seconds / Math.max(maxDwellStep, 1)) * 100))
                : 0;
            return (
              <li key={step.step_id} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-[12px] font-medium text-zinc-700 dark:text-zinc-300" title={step.name}>
                  {step.position}. {step.name}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                    {step.avg_seconds !== null && (
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                  {formatDuration(step.avg_seconds)}
                </span>
                <span className="hidden w-14 shrink-0 text-right font-mono text-[10px] tabular-nums text-zinc-400 sm:inline dark:text-zinc-500">
                  {step.observations}x
                </span>
              </li>
            );
          })}
        </ol>
        {data.avg_dwell_per_step.every((s) => s.avg_seconds === null) && (
          <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500">
            Ainda não há observações suficientes para calcular o tempo médio.
          </p>
        )}
        <p className="mt-3 text-[11px] text-zinc-400 dark:text-zinc-500">
          Médias calculadas a partir das transições registradas em <code className="font-mono">lead_step_changes</code>, incluindo o tempo que os leads atuais estão parados em cada etapa.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads por etapa */}
        <section
          aria-labelledby="step-distribution-title"
          className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="step-distribution-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
              Leads por etapa (atual)
            </h2>
            <Link
              to={`/crms/${crm.id}/board`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Quadro Kanban
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.leads_by_step.map((row) => {
              const pct = Math.max(3, Math.round((row.leads / maxStepLeads) * 100));
              return (
                <div key={row.step_id} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-[12px] font-medium text-zinc-700 dark:text-zinc-300" title={row.name}>
                    {row.position}. {row.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                    {row.leads}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Leads por origem (30d) */}
        <section
          aria-labelledby="source-distribution-title"
          className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
        >
          <h2 id="source-distribution-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
            Leads por origem — últimos 30 dias
          </h2>
          {data.leads_by_source_last_30_days.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
              Nenhum lead com atribuição (UTM) cadastrado no período.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {data.leads_by_source_last_30_days.map((row) => {
                const pct = Math.max(4, Math.round((row.leads / maxSourceLeads) * 100));
                return (
                  <div key={row.source} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate font-mono text-[12px] font-semibold text-zinc-700 dark:text-zinc-300" title={row.source}>
                      {row.source}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-200">
                      {row.leads}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Link
            to="/crms/dashboard"
            className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Ver relatório completo de origens
            <ChevronRight className="h-3 w-3" />
          </Link>
        </section>
      </div>

      {/* Recent changes */}
      <section
        aria-labelledby="recent-changes-title"
        className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
          <h2 id="recent-changes-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
            Últimas movimentações
          </h2>
          <Link
            to={`/crms/${crm.id}/audit`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Ver auditoria completa
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {data.recent_step_changes.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
            {data.recent_step_changes.map((change) => (
              <li key={change.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 text-[13px]">
                <span className="min-w-0 flex-1 truncate font-semibold text-zinc-800 dark:text-zinc-100">
                  {change.lead.name}
                  <span className="ml-2 font-normal text-zinc-400 dark:text-zinc-500">{change.lead.email}</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{change.from_step_name ?? 'nova entrada'}</span>
                  <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">→</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">{change.to_step_name}</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                  {formatDate(change.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
