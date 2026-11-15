import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  MailCheck,
  Send,
  XCircle,
} from 'lucide-react';
import {
  useGroupSendRecipientsQuery,
  useGroupSendsQuery,
} from './hooks';
import { Pagination } from '@/src/components/common/Pagination';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import { formatDateTime } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';
import type { GroupSendStatus, GroupRecipientStatus } from '@/src/lib/types';

const PER_PAGE = 10;
const RECIPIENTS_PER_PAGE = 25;

function statusMeta(status: GroupSendStatus): { label: string; className: string; pulse?: boolean } {
  switch (status) {
    case 'completed':
      return {
        label: 'Concluído',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'completed_with_errors':
      return {
        label: 'Concluído com falhas',
        className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
      };
    default:
      return {
        label: 'Enviando…',
        className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300',
        pulse: true,
      };
  }
}

function recipientMeta(status: GroupRecipientStatus): { label: string; className: string; icon: typeof CheckCircle2 } {
  switch (status) {
    case 'sent':
      return {
        label: 'Enviado',
        icon: CheckCircle2,
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    case 'failed':
      return {
        label: 'Falhou',
        icon: XCircle,
        className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
      };
    default:
      return {
        label: 'Na fila',
        icon: Loader2,
        className: 'border-zinc-950/[0.08] bg-zinc-50 text-zinc-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400',
      };
  }
}

export function GroupSendSection({ groupId }: { groupId: number }) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const sendsQuery = useGroupSendsQuery(groupId, page, PER_PAGE);
  const recipientsQuery = useGroupSendRecipientsQuery(groupId, expandedId, 1, RECIPIENTS_PER_PAGE);

  const sends = sendsQuery.data?.items ?? [];
  const meta = sendsQuery.data;
  const total = meta?.total ?? 0;
  const lastPage = meta ? Math.max(1, Math.ceil(meta.total / PER_PAGE)) : 1;

  return (
    <section
      aria-labelledby="sends-section-title"
      className="rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]"
    >
      <div className="border-b border-zinc-950/[0.06] px-5 py-4 dark:border-white/[0.06]">
        <h2
          id="sends-section-title"
          className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Histórico de disparos
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Quem recebeu, quem falhou e por quê. Atualiza sozinho enquanto um disparo está em andamento.
        </p>
      </div>

      {sendsQuery.isPending ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : sendsQuery.isError ? (
        <div className="p-5">
          <ErrorState
            title="Erro ao carregar os disparos"
            error={sendsQuery.error}
            onRetry={() => void sendsQuery.refetch()}
          />
        </div>
      ) : sends.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Send className="h-5 w-5" />}
            title="Nenhum disparo ainda"
            description="Depois de configurar o template e o SMTP, clique em “Disparar grupo” para enfileirar o envio."
          />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
            {sends.map((send) => {
              const metaBadge = statusMeta(send.status);
              const expanded = expandedId === send.id;
              const recipients = recipientsQuery.data?.items ?? [];
              const recipientsTotal = recipientsQuery.data?.total ?? 0;

              return (
                <li key={send.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : send.id)}
                    aria-expanded={expanded}
                    aria-controls={`send-${send.id}-details`}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-400/15">
                      {send.status === 'processing' ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      ) : (
                        <MailCheck className="h-4 w-4" strokeWidth={1.8} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                          {send.subject}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                          {formatDateTime(send.created_at)}
                        </span>
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            metaBadge.className,
                          )}
                        >
                          {metaBadge.pulse && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                            </span>
                          )}
                          {metaBadge.label}
                        </span>
                        <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{send.sent}</span>
                          {' enviados · '}
                          <span className={cn('font-semibold', send.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400')}>
                            {send.failed}
                          </span>
                          {' falhas · '}
                          {send.total} no total
                        </span>
                      </span>
                    </span>

                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200',
                        expanded && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {expanded && (
                    <div
                      id={`send-${send.id}-details`}
                      className="border-t border-zinc-950/[0.05] bg-zinc-50/60 px-5 py-4 dark:border-white/[0.05] dark:bg-white/[0.02]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                        Destinatários {recipientsTotal > 0 && <span className="font-mono normal-case tracking-normal">· {recipientsTotal}</span>}
                      </p>
                      {recipientsQuery.isPending ? (
                        <div className="mt-3 space-y-2">
                          <Skeleton className="h-9 w-full" />
                          <Skeleton className="h-9 w-full" />
                        </div>
                      ) : recipientsQuery.isError ? (
                        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                          Não foi possível carregar os destinatários.
                        </p>
                      ) : (
                        <>
                          <ul className="mt-2 divide-y divide-zinc-950/[0.05] overflow-hidden rounded-xl border border-zinc-950/[0.07] bg-white dark:divide-white/[0.05] dark:border-white/[0.07] dark:bg-[#17171a]">
                            {recipients.map((recipient) => {
                              const recipientBadge = recipientMeta(recipient.status);
                              const RecipientIcon = recipientBadge.icon;
                              return (
                                <li
                                  key={recipient.id}
                                  className="flex items-start gap-3 px-4 py-2.5"
                                >
                                  <span
                                    className={cn(
                                      'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                                      recipientBadge.className,
                                    )}
                                    title={recipientBadge.label}
                                  >
                                    <RecipientIcon className="h-3.5 w-3.5" strokeWidth={2} />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
                                      {recipient.lead_name}
                                      <span className="ml-2 font-mono text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                                        {recipient.lead_email}
                                      </span>
                                    </span>
                                    {recipient.status === 'failed' && recipient.error_message && (
                                      <span
                                        className="mt-1 block break-words font-mono text-[10px] leading-snug text-red-600 dark:text-red-400"
                                        title={recipient.error_message}
                                      >
                                        {recipient.error_message}
                                      </span>
                                    )}
                                  </span>
                                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                                    {recipient.attempts > 1 ? `${recipient.attempts}x · ` : ''}
                                    {recipient.sent_at ? formatDateTime(recipient.sent_at) : ''}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                          {recipientsTotal > RECIPIENTS_PER_PAGE && (
                            <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                              Exibindo os primeiros {RECIPIENTS_PER_PAGE} de {recipientsTotal} destinatários (falhas primeiro).
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-zinc-950/[0.06] px-5 py-3 dark:border-white/[0.06]">
            <Pagination
              page={page}
              lastPage={lastPage}
              total={total}
              from={meta?.page ? (meta.page - 1) * PER_PAGE + 1 : null}
              to={meta?.page ? Math.min(meta.page * PER_PAGE, total) : null}
              onPageChange={setPage}
              ariaLabel="Paginação de disparos"
            />
          </div>
        </>
      )}
    </section>
  );
}
