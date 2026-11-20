import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, MoveRight, Send } from 'lucide-react';
import { useLeadHistoryQuery } from './hooks';
import { StatusIndicator } from '@/src/components/common/StatusBadge';
import { Skeleton } from '@/src/components/common/Skeleton';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { formatDateTime } from '@/src/lib/format';
import type { LeadHistoryEmail, LeadHistoryMovement } from '@/src/lib/types';

type Filter = 'all' | 'movement' | 'email';

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manual',
  public: 'Público',
  system: 'Sistema',
};

const EMAIL_STATUS: Record<string, { tone: 'success' | 'warning' | 'danger'; label: string }> = {
  sent: { tone: 'success', label: 'Enviado' },
  queued: { tone: 'warning', label: 'Na fila' },
  failed: { tone: 'danger', label: 'Falhou' },
};

function MovementCard({ data }: { data: LeadHistoryMovement }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <MoveRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {data.from_step_name ?? 'Sem etapa'}
        </span>
        <span className="text-zinc-400">→</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {data.to_step_name ?? 'Sem etapa'}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {data.changed_by_name ? `Por ${data.changed_by_name}` : 'Movimentação automática'}
        {' · '}
        {SOURCE_LABEL[data.source] ?? data.source}
      </p>
    </div>
  );
}

function EmailCard({ data }: { data: LeadHistoryEmail }) {
  const status = EMAIL_STATUS[data.status] ?? { tone: 'warning' as const, label: data.status };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {data.send_subject || data.template_name || 'Disparo de e-mail'}
        </span>
        <StatusIndicator tone={status.tone} label={status.label} />
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-400">Destinatário</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{data.lead_email ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-400">Grupo</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{data.group_name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-400">Tentativas</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{data.attempts}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-zinc-400">Enviado em</dt>
          <dd className="text-zinc-700 dark:text-zinc-300">
            {data.sent_at ? formatDateTime(data.sent_at) : '—'}
          </dd>
        </div>
      </dl>

      {data.error_message && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {data.error_message}
        </p>
      )}
    </div>
  );
}

export function LeadHistoryPage() {
  const { id } = useParams();
  const leadId = Number(id);
  const [filter, setFilter] = useState<Filter>('all');
  const historyQuery = useLeadHistoryQuery(leadId, 100);
  const history = historyQuery.data;

  const entries = (history?.timeline ?? []).filter((entry) =>
    filter === 'all' ? true : entry.type === filter,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/leads/${leadId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao lead
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Histórico do lead
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {history
              ? `${history.lead.name} · ${history.lead.email}`
              : 'Movimentações, origem e e-mails recebidos.'}
          </p>
        </div>

        {history && (
          <div className="flex flex-wrap gap-2">
            <Chip size="small" variant="outlined" label={`${history.counts.movements} movimentações`} />
            <Chip size="small" variant="outlined" label={`${history.counts.emails} e-mails`} />
          </div>
        )}
      </div>

      {history?.source && (
        <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-[#17171a]">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Origem do lead</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ['UTM Source', history.source.utm_source],
              ['UTM Medium', history.source.utm_medium],
              ['UTM Campaign', history.source.utm_campaign],
              ['UTM Term', history.source.utm_term],
              ['UTM Content', history.source.utm_content],
              ['Device', history.source.utm_device],
              ['Referrer', history.source.referrer],
              ['Landing page', history.source.landing_page],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
                <dd className="break-all text-zinc-700 dark:text-zinc-300">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'Tudo'],
            ['movement', 'Movimentações'],
            ['email', 'E-mails'],
          ] as Array<[Filter, string]>
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="small"
            variant={filter === value ? 'contained' : 'outlined'}
            color={filter === value ? 'primary' : 'inherit'}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {historyQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {historyQuery.isError && (
        <ErrorState
          title="Não foi possível carregar o histórico"
          error={historyQuery.error}
          onRetry={() => void historyQuery.refetch()}
        />
      )}

      {historyQuery.isSuccess && entries.length === 0 && (
        <EmptyState
          icon={<Send className="h-6 w-6" />}
          title="Nenhum registro encontrado"
          description="As movimentações e os e-mails deste lead aparecerão aqui."
        />
      )}

      {entries.length > 0 && (
        <ol className="relative space-y-4 border-l border-zinc-950/[0.08] pl-6 dark:border-white/[0.08]">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[29px] top-5 h-3 w-3 rounded-full border-2 border-white bg-blue-600 dark:border-[#17171a] dark:bg-blue-400" />
              <article className="rounded-xl border border-zinc-950/[0.07] bg-white p-5 dark:border-white/[0.07] dark:bg-[#17171a]">
                <p className="mb-3 text-xs text-zinc-400">{formatDateTime(entry.created_at)}</p>
                {entry.type === 'movement' ? (
                  <MovementCard data={entry.data as LeadHistoryMovement} />
                ) : (
                  <EmailCard data={entry.data as LeadHistoryEmail} />
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
