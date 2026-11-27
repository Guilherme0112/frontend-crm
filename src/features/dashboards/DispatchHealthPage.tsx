import { AlertOctagon, Mail, MessageCircle } from 'lucide-react';
import { MetaFooter } from '@/src/components/dashboards/MetaFooter';
import { MetricHelp } from '@/src/components/dashboards/MetricHelp';
import { RatioValue } from '@/src/components/dashboards/RatioValue';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { formatDateTime } from '@/src/lib/format';
import type { EmailSendHealth, WhatsappChannelHealth } from '@/src/lib/types';
import { useDispatchHealthDashboard } from './hooks';
import { PageHeader } from '@/src/components/layout/PageHeader';

const CHANNEL_LABEL: Record<string, string> = {
  official: 'WhatsApp oficial',
  unofficial: 'WhatsApp não oficial',
};

/**
 * D5 "Saúde dos disparos".
 *
 * Mede **entrega**, não efetividade: não há abertura, clique nem resposta no
 * sistema. Chamar isso de performance de campanha prometeria o que o dado não
 * sustenta — aqui é operação: o que saiu, o que falhou e por quê.
 */
export function DispatchHealthPage() {
  const query = useDispatchHealthDashboard();

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div>
        <ErrorState
          title="Não foi possível carregar a saúde dos disparos"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const { data, meta } = query.data;
  const channels = Object.entries(data.whatsapp.channels);

  return (
    <div className="space-y-6">
      <PageHeader
        trail={[{ to: "/disparos", label: "Disparos" }]}
        eyebrow="Comunicação"
        title="Saúde dos disparos"
        description="Entrega de e-mail e WhatsApp na janela. A fila não entra na taxa de falha."
      />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex flex-wrap items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">E-mail</h2>
            <MetricHelp label="E-mail">
              Disparos de e-mail com <strong>tentativa</strong> dentro da janela, somando
              todos os grupos. "Na fila" não é falha: é destinatário que ainda não foi
              processado — se esse número não baixa, o worker provavelmente está parado.
            </MetricHelp>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Enviados" value={data.email.sent} />
            <Stat label="Falhas" value={data.email.failed} tone="danger" />
            <Stat label="Na fila" value={data.email.queued} tone="muted" />
            <div>
              <div className="flex items-center gap-2">
                <dt className="text-[11px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                  Taxa de falha
                </dt>
                <MetricHelp label="Taxa de falha">
                  Falhas sobre <strong>enviados mais falhas</strong>. O que está na fila fica
                  fora do divisor: ainda não deu certo nem errado, e contá-lo como sucesso
                  faria a taxa parecer boa justamente quando o worker travou.
                </MetricHelp>
              </div>
              <dd className="mt-1">
                <RatioValue metric={data.email.failure_rate} invertTone />
              </dd>
            </div>
          </dl>

          {data.email.sends.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Nenhum disparo na janela.</p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
              {data.email.sends.map((send) => (
                <SendRow key={send.id} send={send} />
              ))}
            </ul>
          )}

          <TopErrors errors={data.email.top_errors} />
        </section>

        <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex flex-wrap items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">WhatsApp</h2>
            <MetricHelp label="WhatsApp">
              Mesma leitura do e-mail, separada por canal oficial (Meta) e não oficial. Os
              dois têm regras de entrega diferentes, então somá-los esconderia qual dos dois
              está falhando.
            </MetricHelp>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {channels.map(([key, channel]) => (
              <ChannelCard key={key} label={CHANNEL_LABEL[key] ?? key} channel={channel} />
            ))}
          </div>

          <TopErrors
            errors={data.whatsapp.top_errors.map((error) => ({
              message: `[${CHANNEL_LABEL[error.channel] ?? error.channel}] ${error.message}`,
              count: error.count,
            }))}
          />
        </section>
      </div>

      {data.email.sends.length === 0 && channels.every(([, c]) => c.sent + c.failed + c.pending === 0) && (
        <EmptyState
          title="Nenhum disparo na janela"
          description="Quando houver envios, a entrega e os erros mais frequentes aparecem aqui."
        />
      )}

      <MetaFooter meta={meta} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'danger' | 'muted';
}) {
  const color =
    tone === 'danger'
      ? 'text-red-700 dark:text-red-400'
      : tone === 'muted'
        ? 'text-zinc-500 dark:text-zinc-400'
        : 'text-zinc-900 dark:text-zinc-100';

  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className={`mt-1 font-mono text-lg font-semibold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function SendRow({ send }: { send: EmailSendHealth }) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{send.subject}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {send.template_name} · {formatDateTime(send.created_at)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <span className="font-mono text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
          {send.sent}/{send.total}
          {send.queued > 0 && (
            <span className="ml-1 text-zinc-400 dark:text-zinc-500">({send.queued} na fila)</span>
          )}
        </span>
        <RatioValue metric={send.failure_rate} showSample={false} invertTone />
      </div>
    </li>
  );
}

function ChannelCard({ label, channel }: { label: string; channel: WhatsappChannelHealth }) {
  return (
    <div className="rounded-xl border border-zinc-950/[0.07] p-4 dark:border-white/[0.07]">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
        {label}
      </h3>

      <dl className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Enviados" value={channel.sent} />
        <Stat label="Falhas" value={channel.failed} tone="danger" />
        <Stat label="Na fila" value={channel.pending} tone="muted" />
        {/* `skipped` é "nem tentou" (destinatário sem telefone, por exemplo),
            não falha de envio — por isso fica fora da taxa. */}
        <Stat label="Ignorados" value={channel.skipped} tone="muted" />
      </dl>

      <p className="mt-3 flex items-center gap-2">
        <RatioValue metric={channel.failure_rate} invertTone />
        <MetricHelp label="Taxa de falha do canal">
          Falhas sobre enviados mais falhas, neste canal. <strong>Ignorados</strong> ficam de
          fora: são destinatários que nem foram tentados — sem telefone, por exemplo — e
          contá-los como falha culparia o canal por dado faltando no cadastro.
        </MetricHelp>
      </p>
    </div>
  );
}

function TopErrors({ errors }: { errors: { message: string; count: number }[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-zinc-950/[0.07] pt-4 dark:border-white/[0.07]">
      <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
        <AlertOctagon className="h-3.5 w-3.5" />
        Erros mais frequentes
      </h3>

      <ul className="mt-2 space-y-1.5">
        {errors.map((error) => (
          <li key={error.message} className="flex items-start justify-between gap-3">
            {/* A mensagem vem do servidor SMTP ou da API de WhatsApp: texto de
                terceiro, renderizado como texto e nunca como HTML. */}
            <span className="min-w-0 flex-1 break-words font-mono text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {error.message}
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-500 dark:text-zinc-500">
              {error.count}×
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
