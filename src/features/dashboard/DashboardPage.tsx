import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CreditCard, FileText, FolderKanban, History, Users } from 'lucide-react';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { formatCurrency, formatDate, formatDateTime } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';
import { useAuth } from '@/src/auth/AuthContext';
import { MyDaySections } from '@/src/features/dashboards/MyDaySections';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import {
  StatusIndicator,
  getInvoiceStatusMeta,
  getSubscriptionStatusMeta,
} from '@/src/components/common/StatusBadge';
import { PageHeader } from '@/src/components/layout/PageHeader';
import { MetricHelp } from '@/src/components/dashboards/MetricHelp';

const SOURCE_META: Record<string, { label: string; className: string }> = {
  manual: {
    label: 'Manual',
    className:
      'border-zinc-950/[0.08] bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300',
  },
  public: {
    label: 'API pública',
    className:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
  },
  system: {
    label: 'Sistema',
    className:
      'border-zinc-950/[0.08] bg-zinc-50 text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400',
  },
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function DashboardPage() {
  const { company, user } = useAuth();

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: api.getDashboardSummary,
  });

  if (summaryQuery.isError && !summaryQuery.isPending) {
    return (
      <ErrorState
        title="Não foi possível carregar o painel"
        error={summaryQuery.error}
        onRetry={() => void summaryQuery.refetch()}
      />
    );
  }

  const data = summaryQuery.data;
  const isLoading = summaryQuery.isPending;

  const leadsCreatedLast30 = data?.metrics.leads_created_last_30_days ?? 0;
  const windowDays = data?.window_days ?? 30;
  const recentLeads = data?.recent_leads ?? [];
  const recentAudit = data?.recent_audit ?? [];
  const crms = data?.recent_crms ?? [];
  const invoices = data?.billing.recent_invoices ?? [];
  const subscription = data?.subscription;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Início"
        title={`Olá, ${user?.name?.split(' ')[0] || 'bem-vindo'}`}
        description={`Resumo operacional e financeiro de ${company?.name || 'sua empresa'}.`}
        actions={
          <Link
            to="/crms"
            className="btn-saldup inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium sm:w-auto"
          >
            <span>Abrir CRMs</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Metric strip */}
      <section aria-label="Indicadores principais">
        <div className="grid divide-y divide-zinc-950/[0.07] overflow-hidden rounded-xl border border-zinc-950/[0.07] bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-white/[0.07] dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                Leads criados
                <MetricHelp label="Leads criados">
                  Leads cadastrados na janela, somando <strong>todos</strong> os seus pipelines.
                  Conta pela data de criação: lead antigo que você moveu hoje não aparece aqui.
                </MetricHelp>
              </span>
              <Users className="h-4 w-4 text-zinc-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {leadsCreatedLast30}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Nos últimos {windowDays} dias
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                Assinatura
                <MetricHelp label="Assinatura">
                  O plano vigente da empresa e o estado da cobrança. Em carência (past_due) o
                  acesso continua enquanto o Mercado Pago retenta o cartão — vencida a carência,
                  as telas travam.
                </MetricHelp>
              </span>
              <CreditCard className="h-4 w-4 text-zinc-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-32" />
            ) : subscription ? (
              <>
                <p className="mt-2 truncate text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {subscription.plan_name || 'Assinatura Ativa'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <StatusIndicator {...getSubscriptionStatusMeta(subscription.status)} />
                  {subscription.amount !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(subscription.amount, subscription.currency || 'BRL')}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Sem assinatura
                </p>
                <Link
                  to="/billing"
                  className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Escolher um plano
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/*
        "Meu dia" era uma página separada. Virou seção daqui porque as duas
        respondiam à mesma pergunta — "o que eu faço agora?" — e exigiam dois
        cliques para a resposta inteira.
      */}
      <MyDaySections />

      {/* Two-column operational overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimos 5 leads */}
        <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.07] px-4 py-4 sm:px-5 dark:border-white/[0.07]">
            <div className="flex min-w-0 items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-zinc-400" />
              <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Últimos leads
              </h2>
            </div>
            {/*
              Não existe página de "todos os leads": eles vivem dentro dos
              quadros. O link leva ao quadro do CRM do lead mais recente, que é
              de onde esta lista está vindo.
            */}
            <Link
              to={recentLeads[0] ? `/crms/${recentLeads[0].crm_id}/board` : '/crms'}
              className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver mais
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="Nenhum lead cadastrado"
                description="Quando leads entrarem pelos seus CRMs, os 5 mais recentes aparecerão aqui."
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {recentLeads.map((lead) => {
                const color = lead.crm_color || '#52525b';
                return (
                  <li key={lead.id}>
                    <Link
                      to={`/leads/${lead.id}`}
                      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:px-5 dark:hover:bg-white/[0.04]"
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]"
                        style={{ backgroundColor: `${color}1f`, color }}
                        aria-hidden="true"
                      >
                        {initialsOf(lead.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {lead.name}
                          </p>
                          <span className="font-mono text-[10px] tabular-nums text-zinc-400 sm:shrink-0 dark:text-zinc-500">
                            {formatDateTime(lead.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {lead.email ?? 'Sem e-mail'}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-950/[0.08] bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                            <span className="truncate">{lead.crm_name}</span>
                          </span>
                          <span className="inline-flex max-w-full items-center rounded-md bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                            <span className="truncate">{lead.step_name}</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Auditoria - últimas 5 movimentações */}
        <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.07] px-4 py-4 sm:px-5 dark:border-white/[0.07]">
            <div className="flex min-w-0 items-center gap-2">
              <History className="h-4 w-4 shrink-0 text-zinc-400" />
              <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Auditoria
              </h2>
            </div>
            {/*
              A auditoria é por CRM, não global: o link vai para a do CRM da
              movimentação mais recente. Sem nenhuma, cai na lista de CRMs.
            */}
            <Link
              to={recentAudit[0]?.crm_id ? `/crms/${recentAudit[0].crm_id}/audit` : '/crms'}
              className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver mais
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recentAudit.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                icon={<History className="h-5 w-5" />}
                title="Nenhuma movimentação registrada"
                description="Transições de etapa feitas manualmente, pela API pública ou por automações aparecerão aqui."
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {recentAudit.map((change) => {
                const sourceMeta = SOURCE_META[change.source] ?? SOURCE_META.system;
                const color = change.crm_color || '#52525b';
                return (
                  <li key={change.id}>
                    <Link
                      to={`/leads/${change.lead_id}`}
                      className="block px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:px-5 dark:hover:bg-white/[0.04]"
                    >
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {change.lead_name ?? 'Lead removido'}
                        </p>
                        <span className="font-mono text-[10px] tabular-nums text-zinc-400 sm:shrink-0 dark:text-zinc-500">
                          {formatDateTime(change.created_at)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex max-w-full items-center rounded-md border border-dashed border-zinc-950/[0.15] px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-white/[0.12] dark:text-zinc-400">
                          <span className="max-w-[8rem] truncate sm:max-w-none">{change.from_step_name ?? '—'}</span>
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
                        <span className="inline-flex max-w-full items-center rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                          <span className="max-w-[8rem] truncate sm:max-w-none">{change.to_step_name ?? '—'}</span>
                        </span>
                        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', sourceMeta.className)}>
                          {sourceMeta.label}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {change.crm_name && (
                          <span className="inline-flex max-w-full items-center gap-1.5 font-medium">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                            <span className="truncate">{change.crm_name}</span>
                          </span>
                        )}
                        {change.changed_by_name && (
                          <span className="truncate">
                            {change.crm_name && <span aria-hidden="true">· </span>}
                            por {change.changed_by_name}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* CRMs list */}
        <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.07] px-4 py-4 sm:px-5 dark:border-white/[0.07]">
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Seus CRMs
            </h2>
            <Link
              to="/crms"
              className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver mais
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : crms.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                icon={<FolderKanban className="h-5 w-5" />}
                title="Nenhum CRM criado"
                description="Crie seu primeiro CRM para organizar etapas e gerenciar leads no Kanban."
                action={
                  <Link
                    to="/crms"
                    className="btn-saldup inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Criar CRM
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {crms.map((crm) => (
                <li key={crm.id}>
                  <Link
                    to={`/crms/${crm.id}/board`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:justify-between sm:gap-4 sm:px-5 dark:hover:bg-white/[0.04]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                        style={{ backgroundColor: crm.color || '#2563eb' }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {crm.name}
                        </p>
                        {crm.description && (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {crm.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <span className="hidden sm:inline">Abrir Kanban</span>
                      <ArrowRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                      <span className="sr-only sm:hidden">Abrir Kanban</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent invoices */}
        <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.07] px-4 py-4 sm:px-5 dark:border-white/[0.07]">
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Faturas recentes
            </h2>
            <Link to="/invoices" className="shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
              Ver mais
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-4 sm:p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title="Nenhuma fatura emitida"
                description="Ao contratar um plano em Faturamento, a primeira fatura aparecerá aqui."
                action={
                  <Link to="/billing" className="inline-flex items-center rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]">
                    Ver planos disponíveis
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {invoices.map((invoice) => {
                const statusMeta = getInvoiceStatusMeta(invoice.status);
                return (
                  <li key={invoice.id}>
                    {/* Era a única lista da página que não levava a lugar nenhum. */}
                    <Link
                      to="/invoices"
                      className="flex flex-col items-start gap-2 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 dark:hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                          Vencimento {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <StatusIndicator {...statusMeta} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
