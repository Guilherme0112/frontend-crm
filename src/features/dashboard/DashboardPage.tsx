import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CreditCard, FileText, FolderKanban, Users } from 'lucide-react';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { formatCurrency, formatDate } from '@/src/lib/format';
import { useAuth } from '@/src/auth/AuthContext';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import {
  StatusIndicator,
  getInvoiceStatusMeta,
  getSubscriptionStatusMeta,
} from '@/src/components/common/StatusBadge';

export function DashboardPage() {
  const { company, user } = useAuth();

  const leadsQuery = useQuery({
    queryKey: queryKeys.leads.all,
    queryFn: () => api.listLeads(),
  });

  const crmsQuery = useQuery({
    queryKey: queryKeys.crms.all,
    queryFn: api.listCrms,
  });

  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: api.listInvoices,
  });

  const subscriptionsQuery = useQuery({
    queryKey: queryKeys.subscriptions.all,
    queryFn: api.listSubscriptions,
  });

  const plansQuery = useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: api.listPlans,
  });

  const isLoading =
    leadsQuery.isPending ||
    crmsQuery.isPending ||
    invoicesQuery.isPending ||
    subscriptionsQuery.isPending ||
    plansQuery.isPending;

  const firstError =
    leadsQuery.error ||
    crmsQuery.error ||
    invoicesQuery.error ||
    subscriptionsQuery.error ||
    plansQuery.error;

  const refetchAll = () => {
    void leadsQuery.refetch();
    void crmsQuery.refetch();
    void invoicesQuery.refetch();
    void subscriptionsQuery.refetch();
    void plansQuery.refetch();
  };

  if (firstError && !isLoading) {
    return (
      <ErrorState
        title="Não foi possível carregar o painel"
        error={firstError}
        onRetry={refetchAll}
      />
    );
  }

  const leads = leadsQuery.data ?? [];
  const crms = crmsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const subscriptions = subscriptionsQuery.data ?? [];
  const plans = plansQuery.data ?? [];

  const openInvoices = invoices.filter((inv) => inv.status === 'open');
  const openInvoicesTotal = openInvoices.reduce((acc, inv) => acc + Number(inv.amount || 0), 0);

  const activeSubscription =
    subscriptions.find((sub) => sub.status === 'active' || sub.status === 'trialing') ??
    subscriptions[0];

  const activePlan = activeSubscription
    ? plans.find((plan) => plan.id === activeSubscription.plan_id)
    : undefined;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Olá, {user?.name?.split(' ')[0] || 'bem-vindo'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Resumo operacional e financeiro de {company?.name || 'sua empresa'}.
          </p>
        </div>
        <Link
          to="/crms"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap shrink-0 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <span>Abrir pipelines</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 4-column metric strip */}
      <section aria-label="Indicadores principais">
        <div className="grid divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Leads cadastrados</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {leads.length}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Em todos os funis da empresa
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Pipelines (CRMs)</span>
              <FolderKanban className="h-4 w-4 text-slate-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {crms.length}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Quadros Kanban configurados
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Faturas em aberto</span>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-28" />
            ) : (
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(openInvoicesTotal)}
              </p>
            )}
            <p className="mt-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {openInvoices.length}{' '}
              {openInvoices.length === 1 ? 'fatura pendente' : 'faturas pendentes'}
            </p>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Assinatura</span>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-32" />
            ) : activeSubscription ? (
              <>
                <p className="mt-2 truncate text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {activePlan?.name || `Plano #${activeSubscription.plan_id}`}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <StatusIndicator {...getSubscriptionStatusMeta(activeSubscription.status)} />
                  {activePlan && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(activePlan.price, activePlan.currency)}
                      </span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
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

      {/* Two-column operational overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipelines list */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Pipelines de vendas
            </h2>
            <Link
              to="/crms"
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver todos
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : crms.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FolderKanban className="h-5 w-5" />}
                title="Nenhum pipeline criado"
                description="Crie seu primeiro CRM para organizar etapas e gerenciar leads no Kanban."
                action={
                  <Link
                    to="/crms"
                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    Criar pipeline
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {crms.slice(0, 5).map((crm) => (
                <li key={crm.id}>
                  <Link
                    to={`/crms/${crm.id}/board`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                        style={{ backgroundColor: crm.color || '#2563eb' }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {crm.name}
                        </p>
                        {crm.description && (
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {crm.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                      <span>Abrir Kanban</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent invoices */}
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Faturas recentes
            </h2>
            <Link
              to="/invoices"
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Ver todas
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title="Nenhuma fatura emitida"
                description="Ao contratar um plano em Faturamento, a primeira fatura aparecerá aqui."
                action={
                  <Link
                    to="/billing"
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Ver planos disponíveis
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {invoices.slice(0, 5).map((invoice) => {
                const statusMeta = getInvoiceStatusMeta(invoice.status);
                return (
                  <li
                    key={invoice.id}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        Vencimento {formatDate(invoice.due_date)}
                      </p>
                    </div>
                    <StatusIndicator {...statusMeta} />
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
