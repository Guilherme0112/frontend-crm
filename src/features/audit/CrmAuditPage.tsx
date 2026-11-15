import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  History,
  Inbox,
} from 'lucide-react';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import { useCrmQuery } from '@/src/features/crm/hooks';
import { Skeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { formatDate } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';

const SOURCE_META: Record<string, { label: string; className: string }> = {
  manual: {
    label: 'Manual',
    className: 'border-zinc-950/[0.08] bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300',
  },
  public: {
    label: 'API pública',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
  },
  system: {
    label: 'Sistema',
    className: 'border-zinc-950/[0.08] bg-zinc-50 text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400',
  },
};

function stepChip(label: string | null | undefined, variant: 'from' | 'to') {
  if (!label) {
    return (
      <span className="inline-flex items-center rounded-md border border-dashed border-zinc-950/[0.15] px-2 py-0.5 text-[11px] font-medium text-zinc-400 dark:border-white/[0.12] dark:text-zinc-500">
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
        variant === 'to'
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
          : 'border-zinc-950/[0.08] bg-zinc-50 text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300',
      )}
    >
      {label}
    </span>
  );
}

export function CrmAuditPage() {
  const { id } = useParams();
  const crmId = Number(id);
  const [page, setPage] = useState(1);

  const crmQuery = useCrmQuery(crmId);
  const auditQuery = useQuery({
    queryKey: [...queryKeys.audit.leadStepChanges(crmId), page],
    queryFn: () => api.getLeadStepChanges(crmId, page, 25),
    enabled: Number.isFinite(crmId) && crmId > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });

  if (crmQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-80 w-full rounded-2xl" />
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
  const data = auditQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.per_page)) : 1;

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
        <span className="text-zinc-600 dark:text-zinc-300">Auditoria</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Histórico de mudanças</p>
          <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Auditoria de mudanças
          </h1>
          <p className="mt-1 max-w-lg text-sm text-zinc-500 dark:text-zinc-400">
            Toda vez que um lead troca de etapa — quem moveu, de onde para onde e quando. Dados por empresa e por CRM.
          </p>
        </div>
        <Link
          to={`/crms/${crm.id}/board`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-950/[0.1] bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.07]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao quadro
        </Link>
      </div>

      {/* Table */}
      <section
        aria-labelledby="audit-section-title"
        className="overflow-hidden rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-950/[0.06] px-5 py-3.5 dark:border-white/[0.06]">
          <h2
            id="audit-section-title"
            className="flex items-center gap-2 font-display text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-200"
          >
            <History className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
            Transições registradas
          </h2>
          {data && (
            <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
              {data.total} {data.total === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>

        {auditQuery.isPending ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : auditQuery.isError ? (
          <div className="p-5">
            <ErrorState
              title="Erro ao carregar auditoria"
              error={auditQuery.error}
              onRetry={() => void auditQuery.refetch()}
            />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Inbox className="h-5 w-5" />}
              title="Nenhuma mudança registrada"
              description="Quando um lead mudar de etapa pela primeira vez, a transição aparecerá aqui."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-950/[0.06] text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:border-white/[0.06] dark:text-zinc-500">
                    <th className="px-5 py-3">Lead</th>
                    <th className="px-5 py-3">Transição</th>
                    <th className="px-5 py-3">Quem</th>
                    <th className="px-5 py-3">Origem</th>
                    <th className="px-5 py-3">Quando</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
                  {data.items.map((change) => (
                    <tr key={change.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {change.lead.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                          {change.lead.email}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {stepChip(change.from_step?.name, 'from')}
                          <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600">→</span>
                          {stepChip(change.to_step?.name, 'to')}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                        {change.changed_by?.name ?? (
                          <span className="text-zinc-400 dark:text-zinc-500">sistema</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                            (SOURCE_META[change.source] ?? SOURCE_META.system).className,
                          )}
                        >
                          {(SOURCE_META[change.source] ?? SOURCE_META.system).label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        {formatDate(change.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 border-t border-zinc-950/[0.06] px-5 py-3 dark:border-white/[0.06]">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Página <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{data.page}</span> de {totalPages}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  aria-label="Página anterior"
                  className="rounded-lg border border-zinc-950/[0.1] p-1.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.1] dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={data.page >= totalPages || auditQuery.isFetching}
                  aria-label="Próxima página"
                  className="rounded-lg border border-zinc-950/[0.1] p-1.5 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/[0.1] dark:hover:bg-white/[0.05] dark:hover:text-zinc-100"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
