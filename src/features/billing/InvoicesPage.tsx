import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';
import { useInvoicesQuery } from './hooks';
import * as api from '@/src/lib/api';
import { Pagination } from '@/src/components/common/Pagination';
import { TableRowsSkeleton } from '@/src/components/common/Skeleton';
import { TableActionsMenu } from '@/src/components/common/TableActionsMenu';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import {
  StatusIndicator,
  getInvoiceStatusMeta,
} from '@/src/components/common/StatusBadge';
import { useToast } from '@/src/components/common/Toast';
import { getApiErrorMessage } from '@/src/lib/formErrors';
import { formatCurrency, formatDate, formatDateTime } from '@/src/lib/format';
import { PageHeader } from '@/src/components/layout/PageHeader';

export function InvoicesPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const invoicesQuery = useInvoicesQuery(page);

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleViewPdf = async (invoiceId: number) => {
    setDownloadingId(invoiceId);

    // A aba precisa ser aberta aqui, ainda dentro do clique: abrir depois do
    // await faz o bloqueador de pop-up barrar, porque já não há gesto do
    // usuário associado.
    const viewer = window.open('', '_blank');

    try {
      const { blob, fileName } = await api.downloadInvoicePdf(invoiceId);

      // objectURL em vez de data URI: o PDF pode passar de alguns MB, e a
      // string base64 estouraria o limite de tamanho de URL do navegador.
      const url = URL.createObjectURL(blob);

      if (viewer) {
        viewer.location.href = url;
      } else {
        // Pop-up bloqueado: em vez de falhar, entrega o arquivo.
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      // Revogar na hora cortaria o PDF antes de a aba carregar; a folga dá
      // tempo de o visualizador ler o blob.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      viewer?.close();
      toast.error('Erro ao gerar o recibo', getApiErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  const invoices = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta ?? null;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;

  // A baixa chega pelo webhook e pode esvaziar a última página enquanto ela
  // está aberta; se a página deixar de existir, volta para a última válida.
  useEffect(() => {
    if (meta && page > meta.last_page) {
      setPage(Math.max(1, meta.last_page));
    }
  }, [meta, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title="Faturas"
        description="Acompanhe as cobranças geradas pelas assinaturas. A baixa é automática: o Mercado Pago avisa quando o pagamento entra."
        actions={
          <Link
            to="/billing"
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-950/[0.12] bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:w-auto dark:border-white/[0.12] dark:bg-[#17171a] dark:text-zinc-200 dark:hover:bg-white/[0.07]"
          >
            Gerenciar assinatura
          </Link>
        }
      />

      {invoicesQuery.isPending ? (
        <div className="rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <TableRowsSkeleton rows={5} cols={7} />
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
              className="btn-saldup inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
            >
              Ir para Planos e Assinatura
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-950/[0.07] bg-white dark:border-white/[0.07] dark:bg-[#17171a]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-950/[0.07] text-xs font-medium text-zinc-500 dark:border-white/[0.07] dark:text-zinc-400">
                <th className="px-5 py-3">Fatura</th>
                <th className="px-5 py-3">Assinatura</th>
                <th className="px-5 py-3 text-right">Valor</th>
                <th className="px-5 py-3">Vencimento</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Pago em</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/[0.07] dark:divide-white/[0.07]">
              {invoices.map((inv) => {
                const statusMeta = getInvoiceStatusMeta(inv.status);
                return (
                  <tr
                    key={inv.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      #{inv.id}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      Assinatura #{inv.subscription_id}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusIndicator {...statusMeta} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                      {inv.paid_at ? formatDateTime(inv.paid_at) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <TableActionsMenu
                        label={`Ações da fatura #${inv.id}`}
                        actions={[
                          {
                            label: downloadingId === inv.id ? 'Gerando...' : 'Ver recibo',
                            icon: <Eye className="h-4 w-4" />,
                            disabled: downloadingId === inv.id,
                            onClick: () => void handleViewPdf(inv.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 0 && (
        <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
          <Pagination
            page={meta?.current_page ?? page}
            lastPage={lastPage}
            total={total}
            from={meta?.from ?? null}
            to={meta?.to ?? null}
            onPageChange={setPage}
            ariaLabel="Paginação de faturas"
          />
        </div>
      )}

    </div>
  );
}
