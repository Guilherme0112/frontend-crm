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
import { MetricHelp } from '@/src/components/dashboards/MetricHelp';
import { BarRow } from '@/src/components/charts/BarRow';
import { DeviceBreakdown } from './DeviceBreakdown';
import { FunnelSections } from '@/src/features/dashboards/FunnelSections';
import { useAuth } from '@/src/auth/AuthContext';
import { canViewReports } from '@/src/lib/permissions';
import { PageHeader } from '@/src/components/layout/PageHeader';

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
  hint,
  help,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  tint: string;
  hint?: string;
  help: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-950/[0.07] bg-white p-4 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tint)}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
          <span className="min-w-0 truncate">{label}</span>
          <MetricHelp label={label}>{help}</MetricHelp>
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
  const { user } = useAuth();

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

  return (
    <div className="space-y-6">
      <PageHeader
        trail={[
          { to: '/crms', label: 'Todos os CRMs' },
          { to: `/crms/${crm.id}/board`, label: crm.name },
          { label: 'Visão geral' },
        ]}
        icon={
          <span
            className="h-3.5 w-3.5 rounded-sm border border-black/10"
            style={{ backgroundColor: crm.color || '#2563eb' }}
          />
        }
        eyebrow="Relatório de 30 dias"
        title={`${crm.name} — Visão geral`}
        description={`Métricas dos últimos ${data.window_days} dias e distribuição atual dos leads por etapa.`}
        actions={
          <Link
            to={`/crms/${crm.id}/board`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 sm:w-auto dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao quadro
          </Link>
        }
      />

      {/* Stat tiles */}
      <section aria-label="Indicadores dos últimos 30 dias" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Leads no total"
          value={String(data.leads_total)}
          icon={UsersRound}
          help="Todos os leads vivos deste pipeline, sem recorte de período e sem separar por etapa. Lead excluído não conta; lead ganho ou perdido continua contando, porque ele existe."
          tint="bg-blue-50 text-blue-600 ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-400 dark:ring-blue-400/15"
        />
        <StatCard
          label="Leads (30 dias)"
          value={String(data.leads_last_30_days)}
          icon={BarChart3}
          help="Leads criados na janela, pela data de cadastro. É volume de entrada: não diz nada sobre o que foi ganho ou perdido no mesmo período."
          tint="bg-violet-50 text-violet-600 ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-400 dark:ring-violet-400/15"
          hint={`nos últimos ${data.window_days} dias`}
        />
        <StatCard
          label="Permanência média"
          value={formatDuration(data.general_avg_dwell_seconds)}
          icon={Timer}
          help="Média do tempo que um lead fica numa etapa, somando todas elas e todo o histórico do pipeline. Conta também quem está parado numa etapa agora — por isso o número sobe sozinho num pipeline que não anda, e é essa a informação. Para o tempo de travessia já concluída, use 'Tempo por etapa' mais abaixo, que usa mediana e p90."
          tint="bg-emerald-50 text-emerald-600 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-400/15"
          hint={`${data.dwell_observations} observações`}
        />
      </section>

      {/* Tempo médio por etapa */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads por etapa */}
        <section
          aria-labelledby="step-distribution-title"
          className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <h2 id="step-distribution-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
                Leads por etapa (atual)
              </h2>
              <MetricHelp label="Leads por etapa (atual)">
                Onde os leads estão <strong>agora</strong>, sem recorte de período. É uma foto
                do quadro, não um histórico: mover um card muda este gráfico na hora. O valor
                ao lado de cada etapa é a soma dos leads que têm valor preenchido.
              </MetricHelp>
            </div>
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
              return (
                <BarRow
                  key={row.step_id}
                  label={`${row.position}. ${row.name}`}
                  title={row.name}
                  max={maxStepLeads}
                  segments={[{ value: row.leads, className: 'bg-gradient-to-r from-blue-600 to-indigo-500' }]}
                  value={row.leads}
                />
              );
            })}
          </div>
        </section>

        {/* Leads por origem (30d) */}
        <section
          aria-labelledby="source-distribution-title"
          className="rounded-2xl border border-zinc-950/[0.07] bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
        >
          <div className="flex items-center gap-2">
            <h2 id="source-distribution-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
              Leads por origem — últimos 30 dias
            </h2>
            <MetricHelp label="Leads por origem — últimos 30 dias">
              De onde vieram os leads <strong>criados</strong> nos últimos 30 dias, pelo
              utm_source da captação. Lead cadastrado à mão não tem origem e cai em
              "(não informado)" — ele não some da conta, só não ajuda a decidir onde
              investir.
            </MetricHelp>
          </div>
          {data.leads_by_source_last_30_days.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
              Nenhum lead com atribuição (UTM) cadastrado no período.
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {data.leads_by_source_last_30_days.map((row) => {
                return (
                  <BarRow
                    key={row.source}
                    label={row.source}
                    title={row.source}
                    labelClassName="font-mono font-semibold"
                    max={maxSourceLeads}
                    minPercent={4}
                    segments={[{ value: row.leads, className: 'bg-gradient-to-r from-violet-600 to-indigo-500' }]}
                    value={row.leads}
                  />
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

      {/* Leads por dispositivo (30d) */}
      <DeviceBreakdown
        rows={data.leads_by_device_last_30_days}
        windowDays={data.window_days}
        title="Leads por dispositivo — últimos 30 dias"
      />

      {canViewReports(user?.role) && <FunnelSections crmId={crmId} />}

      {/*
        Por último de propósito: é registro, não medida. Quem abre esta tela
        vem atrás dos números — a lista de movimentações é o que se consulta
        depois de achar algo estranho neles.
      */}
      <section
        aria-labelledby="recent-changes-title"
        className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
          <div className="flex min-w-0 items-center gap-2">
            <h2 id="recent-changes-title" className="font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
              Últimas movimentações
            </h2>
            <MetricHelp label="Últimas movimentações">
              As trocas de etapa mais recentes deste pipeline, com quem moveu e quando.
              Movimentação feita pela API pública aparece sem autor. Para o histórico
              completo, use a auditoria.
            </MetricHelp>
          </div>
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
                <span className="w-full min-w-0 truncate font-semibold text-zinc-800 sm:w-auto sm:flex-1 dark:text-zinc-100">
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
