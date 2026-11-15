import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText } from 'lucide-react';
import { useInvoicesQuery, usePayInvoiceMutation } from './hooks';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import {
  StatusIndicator,
  getInvoiceStatusMeta,
} from '@/src/components/common/StatusBadge';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { formatCurrency, formatDate, formatDateTime } from '@/src/lib/format';

export function InvoicesPage() {
  const { toast } = useToast();
  const invoicesQuery = useInvoicesQuery();
  const payMutation = usePayInvoiceMutation();
  const [payingId, setPayingId] = useState<number | null>(null);

  const handlePay = async (invoiceId: number) => {
    setPayingId(invoiceId);
    try {
      await payMutation.mutateAsync(invoiceId);
      toast.success('Fatura marcada como paga');
    } catch (error) {
      toast.error('Erro ao pagar fatura', getApiErrorMessage(error));
    } finally {
      setPayingId(null);
    }
  };

  const invoices = invoicesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Faturas
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Acompanhe as cobranças geradas pelas assinaturas e registre pagamentos.
          </p>
        </div>

        <Link
          to="/billing"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Gerenciar assinatura
        </Link>
      </div>

      {invoicesQuery.isPending ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <TableRowsSkeleton rows={5} cols={6} />
        </div>
      ) : invoicesQuery.isError ? (
        <ErrorState
          title="Erro ao carregar faturas"
          error={invoicesQuery.error}
          onRetry={() => void invoicesQuery.refetch()}
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Nenhuma fatura encontrada"
          description="As faturas são geradas automaticamente ao contratar uma assinatura em Planos e Assinatura."
          action={
            <Link
              to="/billing"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Ir para Planos e Assinatura
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3">Fatura</th>
                <th className="px-5 py-3">Assinatura</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3">Vencimento</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Pago em</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {invoices.map((inv) => {
                const statusMeta = getInvoiceStatusMeta(inv.status);
                return (
                  <tr
                    key={inv.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      #{inv.id}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      Assinatura #{inv.subscription_id}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusIndicator {...statusMeta} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                      {inv.paid_at ? formatDateTime(inv.paid_at) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.status === 'open' ? (
                        <button
                          type="button"
                          onClick={() => void handlePay(inv.id)}
                          disabled={payingId === inv.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{payingId === inv.id ? 'Pagando...' : 'Marcar como paga'}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
