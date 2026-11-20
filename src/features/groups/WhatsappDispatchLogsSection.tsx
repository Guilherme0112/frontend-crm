import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, MessageCircle, RefreshCw, XCircle } from 'lucide-react';
import { useWhatsappDispatchLogsQuery } from './hooks';
import { useWhatsappSendersInfiniteQuery } from '@/src/features/whatsapp-senders/hooks';
import { useWhatsappTemplatesInfiniteQuery } from '@/src/features/whatsapp-templates/hooks';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import { formatDateTime } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';
import type { WhatsappDispatchStatus } from '@/src/lib/types';

function statusMeta(status: WhatsappDispatchStatus) {
  switch (status) {
    case 'sent':
      return {
        label: 'Enviado',
        icon: CheckCircle2,
        className:
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'failed':
      return {
        label: 'Falhou',
        icon: XCircle,
        className:
          'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
      };
    default:
      return {
        label: 'Pendente',
        icon: Clock3,
        className:
          'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
      };
  }
}

export function WhatsappDispatchLogsSection({ groupId }: { groupId: number }) {
  const [status, setStatus] = useState<WhatsappDispatchStatus | 'all'>('all');

  const logsQuery = useWhatsappDispatchLogsQuery({
    group_id: groupId,
    status: status === 'all' ? undefined : status,
  });
  const sendersQuery = useWhatsappSendersInfiniteQuery(100, true);
  const templatesQuery = useWhatsappTemplatesInfiniteQuery(100, true);

  const senderNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of sendersQuery.items ?? []) map.set(s.id, s.name);
    return map;
  }, [sendersQuery.items]);

  const templateNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of templatesQuery.items ?? []) map.set(t.id, t.name);
    return map;
  }, [templatesQuery.items]);

  const logs = logsQuery.data ?? [];
  const hasPending = logs.some((l) => l.status === 'pending');

  return (
    <section
      aria-labelledby="whatsapp-logs-title"
      className="rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
    >
      <div className="border-b border-zinc-950/[0.06] px-5 py-4 dark:border-white/[0.06]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2
              id="whatsapp-logs-title"
              className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Logs de disparo WhatsApp
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Auditoria por destinatÃ¡rio (status, tentativas, WAMID e erros). Atualiza automaticamente enquanto houver pendÃªncias.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {hasPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processando
              </span>
            )}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as WhatsappDispatchStatus | 'all');
              }}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              aria-label="Filtrar status dos logs WhatsApp"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="sent">Enviado</option>
              <option value="failed">Falhou</option>
            </select>
            <button
              type="button"
              onClick={() => void logsQuery.refetch()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200"
              title="Atualizar logs"
              aria-label="Atualizar logs"
            >
              <RefreshCw className={cn('h-4 w-4', logsQuery.isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {logsQuery.isPending ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : logsQuery.isError ? (
        <div className="p-5">
          <ErrorState
            title="Erro ao carregar logs do WhatsApp"
            error={logsQuery.error}
            onRetry={() => void logsQuery.refetch()}
          />
        </div>
      ) : logs.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<MessageCircle className="h-5 w-5" />}
            title="Nenhum log de WhatsApp"
            description="Dispare pelo canal WhatsApp para registrar envios e acompanhar status, WAMID e erros."
          />
        </div>
      ) : (
        <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
          {logs.map((log) => {
            const meta = statusMeta(log.status);
            const Icon = meta.icon;
            return (
              <li key={log.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                      meta.className,
                    )}
                    title={meta.label}
                  >
                    <Icon className={cn('h-4 w-4', log.status === 'pending' && 'animate-pulse')} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Lead #{log.lead_id ?? 'â€”'} Â· {log.recipient_phone}
                      </p>
                      <span className="font-mono text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                        {formatDateTime(log.sent_at ?? log.created_at ?? '')}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', meta.className)}>
                        {meta.label}
                      </span>
                      <span>Remetente: <span className="font-medium text-zinc-700 dark:text-zinc-200">{senderNameById.get(log.whatsapp_sender_id) ?? `#${log.whatsapp_sender_id}`}</span></span>
                      <span>Template: <span className="font-medium text-zinc-700 dark:text-zinc-200">{templateNameById.get(log.whatsapp_template_id) ?? `#${log.whatsapp_template_id}`}</span></span>
                      <span>Tentativas: <span className="font-mono">{log.attempts}</span></span>
                      {log.wamid && (
                        <span className="font-mono text-[10px]" title={log.wamid}>
                          WAMID: {log.wamid}
                        </span>
                      )}
                    </div>
                    {log.status === 'failed' && log.error_message && (
                      <p className="mt-1.5 break-words font-mono text-[10px] leading-snug text-red-600 dark:text-red-400">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
