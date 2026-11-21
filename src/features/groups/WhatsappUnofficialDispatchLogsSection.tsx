import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Loader2, MessageCircle, RefreshCw, XCircle, Ban } from 'lucide-react';
import { useWhatsappUnofficialDispatchLogsQuery } from './hooks';
import { useWhatsappUnofficialInstancesInfiniteQuery } from '@/src/features/whatsapp-unofficial-instances/hooks';
import { useWhatsappUnofficialTemplatesInfiniteQuery } from '@/src/features/whatsapp-unofficial-templates/hooks';
import { Pagination } from '@/src/components/common/Pagination';
import { Skeleton } from '@/src/components/common/Skeleton';
import { ErrorState } from '@/src/components/common/ErrorState';
import { EmptyState } from '@/src/components/common/EmptyState';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { formatDateTime } from '@/src/lib/format';
import { cn } from '@/src/lib/cn';

function statusMeta(status: string) {
  switch (status) {
    case 'sent':
      return { label: 'Enviado', icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300' };
    case 'failed':
      return { label: 'Falhou', icon: XCircle, className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300' };
    case 'skipped':
      return { label: 'Ignorado', icon: Ban, className: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300' };
    default:
      return { label: 'Pendente', icon: Clock3, className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300' };
  }
}

export function WhatsappUnofficialDispatchLogsSection({ groupId, defaultExpanded = false, resolveNames = true }: { groupId: number; defaultExpanded?: boolean; resolveNames?: boolean }) {
  const [status, setStatus] = useState<string>('all');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;
  const logsQuery = useWhatsappUnofficialDispatchLogsQuery({ group_id: groupId, status: status === 'all' ? undefined : status }, page, PER_PAGE, expanded);
  const instancesQuery = useWhatsappUnofficialInstancesInfiniteQuery(100, expanded && resolveNames);
  const templatesQuery = useWhatsappUnofficialTemplatesInfiniteQuery(100, expanded && resolveNames);

  const instanceNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const i of instancesQuery.items ?? []) map.set(i.id, i.name);
    return map;
  }, [instancesQuery.items]);
  const templateNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of templatesQuery.items ?? []) map.set(t.id, t.name);
    return map;
  }, [templatesQuery.items]);

  const logs = logsQuery.data?.data ?? [];
  const meta = logsQuery.data?.meta;
  const hasPending = logs.some((l) => l.status === 'pending');

  return (
    <section className="rounded-2xl border border-zinc-950/[0.07] bg-white shadow-sm dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="border-b border-zinc-950/[0.06] px-5 py-4 dark:border-white/[0.06]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Logs de disparo WhatsApp (Não oficial)</h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Auditoria por destinatário para instâncias não oficiais.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {hasPending && <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"><Loader2 className="h-3 w-3 animate-spin" />Processando</span>}
            {expanded && (<>
              <TextField select size="small" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filtrar status dos logs WhatsApp não oficial" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
                <MenuItem value="all">Todos os status</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="sent">Enviado</MenuItem>
                <MenuItem value="failed">Falhou</MenuItem>
                <MenuItem value="skipped">Ignorado</MenuItem>
              </TextField>
              <IconButton onClick={() => void logsQuery.refetch()} title="Atualizar logs" aria-label="Atualizar logs" size="medium" sx={{ width: { xs: '100%', sm: 'auto' }, border: { xs: '1px solid', sm: 'none' }, borderColor: 'divider', borderRadius: 2 }}><RefreshCw className={cn('h-4 w-4', logsQuery.isFetching && 'animate-spin')} /></IconButton>
            </>)}
            <Button variant="outlined" color="inherit" size="medium" onClick={() => setExpanded((v) => !v)} sx={{ textTransform: 'none', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}>{expanded ? 'Ocultar' : 'Mostrar logs'}</Button>
          </div>
        </div>
      </div>

      {!expanded ? (
        <div className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">Clique em "Mostrar logs" para carregar os disparos quando necessário.</div>
      ) : logsQuery.isPending ? (
        <div className="space-y-3 p-5"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
      ) : logsQuery.isError ? (
        <div className="p-5"><ErrorState title="Erro ao carregar logs não oficiais" error={logsQuery.error} onRetry={() => void logsQuery.refetch()} /></div>
      ) : logs.length === 0 ? (
        <div className="p-5"><EmptyState icon={<MessageCircle className="h-5 w-5" />} title="Nenhum log não oficial" description="Dispare pelo provedor não oficial para registrar envios aqui." /></div>
      ) : (
        <ul className="divide-y divide-zinc-950/[0.05] dark:divide-white/[0.05]">
          {logs.map((log) => {
            const meta = statusMeta(log.status);
            const Icon = meta.icon;
            return (
              <li key={log.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3">
                  <span className={cn('mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', meta.className)}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{log.recipient_phone || '—'}</span>
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', meta.className)}>{meta.label}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span>Instância: {instanceNameById.get(log.whatsapp_unofficial_instance_id) ?? `#${log.whatsapp_unofficial_instance_id}`}</span>
                      <span>Template: {log.whatsapp_unofficial_template_id ? (templateNameById.get(log.whatsapp_unofficial_template_id) ?? `#${log.whatsapp_unofficial_template_id}`) : '—'}</span>
                      <span>Tentativas: {log.attempts}</span>
                      {log.sent_at ? <span>Enviado: {formatDateTime(log.sent_at)}</span> : null}
                      {log.external_message_id ? <span className="font-mono">ID: {log.external_message_id}</span> : null}
                    </div>
                    {log.error_message ? <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{log.error_message}</p> : null}
                  </div>
                </div>
              </li>
            );
          })}
        <div className="border-t border-zinc-950/[0.06] px-5 py-2 dark:border-white/[0.06]">
          <Pagination
            page={page}
            lastPage={meta?.last_page ?? 1}
            total={meta?.total ?? 0}
            from={meta?.from ?? null}
            to={meta?.to ?? null}
            onPageChange={setPage}
            ariaLabel="Paginação de logs WhatsApp não oficial"
          />
        </div>

        </ul>
      )}
    </section>
  );
}
