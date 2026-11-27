import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { MetricHelp } from '@/src/components/dashboards/MetricHelp';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { formatCents } from '@/src/lib/format';
import type { MyDayEvent, MyDayLead, StalledBand } from '@/src/lib/types';
import { useMyDayDashboard } from './hooks';

const TYPE_LABEL: Record<string, string> = {
  meeting: 'Reunião',
  call: 'Ligação',
  follow_up: 'Follow-up',
};

/**
 * O bloco "Meu dia" da página inicial.
 *
 * É uma lista de trabalho, não uma medição: não há percentual aqui de
 * propósito. "82% dos leads com próximo passo" não diz o que fazer agora; uma
 * fila ordenada do mais parado para o menos, sim.
 *
 * **Cinco linhas por lista, como as demais da Visão Geral.** O que passa disso
 * não é escondido: o contador ao lado do título mostra o tamanho real da
 * fila, e o "Ver mais" leva à tela onde ela cabe inteira. Crescer aqui
 * dentro transformaria um resumo em mais uma lista para rolar.
 */
export function MyDaySections() {
  const query = useMyDayDashboard();

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Não foi possível carregar o seu dia"
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { data, meta } = query.data;

  return (
    <div className="space-y-6">
      {/*
        Duas colunas a partir de `lg`, uma só no celular e no tablet.

        O par de cima é agenda: o que está marcado para hoje e o que ficou sem
        desfecho. O par de baixo é fila de trabalho: onde os leads estão parados
        e quais não têm próximo passo. Cada par responde a uma pergunta.

        `items-start` impede que a coluna curta ("Tempo na etapa") estique até a
        altura da longa ("Sem próximo passo") e fique com um vazio no fim.
      */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Section
          icon={<CalendarClock className="h-4 w-4" />}
          title="Agenda de hoje"
          help="Compromissos seus com início dentro de hoje, no fuso da empresa. Reagendar tira daqui; cancelar também. O número ao lado do título é a fila inteira; aqui aparecem as 5 primeiras."
          empty="Nenhum compromisso hoje."
          total={data.day_agenda.total}
          shown={data.day_agenda.items.length}
          moreTo="/agenda"
        >
          <ul className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
            {data.day_agenda.items.map((event) => (
              <EventRow key={event.id} event={event} timezone={meta.company_timezone} showStatus />
            ))}
          </ul>
        </Section>

        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Compromissos sem desfecho"
          help="Compromissos seus que já passaram da hora e continuam como agendados — ninguém registrou se aconteceu. Não é atraso de agenda, é registro faltando: sem o desfecho, a taxa de comparecimento do time mede menos do que parece. Lista vazia aqui é sucesso."
          /* Lista vazia aqui é sucesso: significa que tudo foi registrado. */
          empty="Nada pendente de registro."
          total={data.overdue_events.total}
          shown={data.overdue_events.items.length}
          moreTo="/agenda"
          tone={data.overdue_events.total > 0 ? 'warning' : 'neutral'}
        >
          <ul className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
            {data.overdue_events.items.map((event) => (
              <EventRow key={event.id} event={event} timezone={meta.company_timezone} />
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <StalledSection bands={data.stalled_bands} />

        <Section
          icon={<Inbox className="h-4 w-4" />}
          title="Sem próximo passo"
          help={
            <>
              Leads em etapa <strong>aberta</strong> (nem ganho nem perdido) sem nenhum
              compromisso futuro marcado. Ordenados do mais parado para o menos, pelo tempo
              desde a última mudança de etapa. É fila de trabalho, não indicador: o que se
              faz com um item daqui é abrir o lead e marcar o próximo contato.
            </>
          }
          empty="Todo lead tem um próximo passo marcado."
          hint={
            data.scoped_to_own_leads
              ? 'Apenas os leads que você cadastrou.'
              : 'Leads em etapa aberta, do mais parado para o menos.'
          }
          total={data.leads_without_next_step.total}
          shown={data.leads_without_next_step.items.length}
          moreTo="/crms"
        >
          <ul className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
            {data.leads_without_next_step.items.map((lead) => (
              <LeadRow key={lead.id} lead={lead} currency={meta.currency} />
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  help,
  empty,
  hint,
  tone = 'neutral',
  total,
  shown,
  moreTo,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  help: React.ReactNode;
  empty: string;
  hint?: string;
  tone?: 'neutral' | 'warning';
  /** Tamanho real da fila, não o das linhas mostradas. */
  total: number;
  /** Quantas linhas esta tela está exibindo. */
  shown: number;
  /** Para onde o "Ver mais" leva. */
  moreTo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            tone === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-blue-600 dark:text-blue-400'
          }
        >
          {icon}
        </span>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <MetricHelp label={title}>{help}</MetricHelp>
        {/* O total é o tamanho real da fila, não o das 5 linhas visíveis. */}
        <span className="rounded-full bg-zinc-950/[0.05] px-2 py-0.5 font-mono text-[11px] tabular-nums text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
          {total}
        </span>

        {/* Só aparece quando sobrou fila além do que está na tela. */}
        {shown < total && (
          <Link
            to={moreTo}
            className="ml-auto shrink-0 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Ver mais
          </Link>
        )}
      </div>

      {hint && <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>}

      {total === 0 ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {empty}
        </p>
      ) : (
        <>
          <div className="mt-2">{children}</div>
        </>
      )}
    </section>
  );
}

function StalledSection({ bands }: { bands: StalledBand[] }) {
  const total = bands.reduce((sum, band) => sum + band.count, 0);
  const max = Math.max(1, ...bands.map((band) => band.count));

  return (
    <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex flex-wrap items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tempo na etapa atual</h2>
        <MetricHelp label="Tempo na etapa atual">
          Distribuição dos leads <strong>em etapa aberta</strong> pelo tempo desde a última
          mudança de etapa — não desde a criação. Lead que acabou de ser movido volta para a
          primeira faixa, mesmo sendo antigo. As faixas somam todos os leads vivos; a lista ao
          lado conta só os sem próximo passo, então os dois totais não batem de propósito.
        </MetricHelp>
      </div>
      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
        {total} leads em etapa aberta, pelo tempo desde a última mudança.
      </p>

      <ul className="mt-4 space-y-2">
        {bands.map((band) => (
          <li key={band.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-zinc-600 dark:text-zinc-400">{band.label}</span>

            {/* A cor nunca é o único portador de significado: a barra tem
                rótulo à esquerda e valor à direita. */}
            <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-950/[0.05] dark:bg-white/[0.06]">
              <span
                className="block h-full rounded-full bg-blue-500/70"
                style={{ width: `${(band.count / max) * 100}%` }}
              />
            </span>

            <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
              {band.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LeadRow({ lead, currency }: { lead: MyDayLead; currency: string }) {
  const days = daysSince(lead.in_step_since);

  return (
    <li>
      {/*
        A linha inteira é o alvo, não só o nome: num item de 44px de altura, um
        link de uma palavra é alvo pequeno demais — principalmente no celular.
        As margens negativas estendem o realce até a borda do cartão sem mexer
        no alinhamento do conteúdo.
      */}
      <Link
        to={`/leads/${lead.id}`}
        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{lead.name}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {[lead.crm_name, lead.step_name ?? 'Etapa removida'].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {lead.value_cents !== null && (
            <p className="font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
              {formatCents(lead.value_cents, currency)}
            </p>
          )}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {days === 0 ? 'hoje' : `há ${days} ${days === 1 ? 'dia' : 'dias'}`}
          </p>
        </div>
      </Link>
    </li>
  );
}

function EventRow({
  event,
  timezone,
  showStatus = false,
}: {
  event: MyDayEvent;
  timezone: string;
  showStatus?: boolean;
}) {
  const time = new Date(event.starts_at.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', {
    timeZone: timezone,
    dateStyle: showStatus ? undefined : 'short',
    timeStyle: 'short',
  });

  return (
    <li>
      {/*
        Leva ao lead, não à agenda: o que se faz com um compromisso de hoje —
        ou com um que ficou sem desfecho — é abrir o lead e agir. A página do
        lead já mostra a agenda dele.
      */}
      <Link
        to={`/leads/${event.lead_id}`}
        className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{event.title}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {[TYPE_LABEL[event.type] ?? event.type, event.lead_name].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">{time}</p>
          {showStatus && event.status && event.status !== 'scheduled' && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{event.status}</p>
          )}
        </div>
      </Link>
    </li>
  );
}

/** A API devolve o instante em UTC; o "há N dias" é aproximado por dia inteiro. */
function daysSince(utc: string): number {
  const since = new Date(utc.replace(' ', 'T') + 'Z').getTime();

  return Math.max(0, Math.floor((Date.now() - since) / 86_400_000));
}
