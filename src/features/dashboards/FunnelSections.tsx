import { useMemo } from 'react';
import { Coins, Timer, TrendingDown, Trophy } from 'lucide-react';
import { GoogleChart, type ChartRow } from '@/src/components/charts/GoogleChart';
import { BarRow } from '@/src/components/charts/BarRow';
import { MetricHelp } from '@/src/components/dashboards/MetricHelp';
import { RatioValue } from '@/src/components/dashboards/RatioValue';
import { SetupNotice } from '@/src/components/dashboards/SetupNotice';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { formatCents } from '@/src/lib/format';
import type { DashboardMeta, FunnelDashboard } from '@/src/lib/types';
import { useFunnelDashboard } from './hooks';

/**
 * Funil, conversão e origem de **um** pipeline.
 *
 * Sem `MetaFooter`: o cabeçalho da página já diz "Relatório de 30 dias" e a
 * janela por extenso, e o rodapé do bloco ficava encalhado no meio da tela,
 * entre o funil e as últimas movimentações — lendo como fim de página com
 * conteúdo depois. As telas de disparos e de time continuam com ele, porque
 * lá é o fim da página de verdade.
 *
 * Era uma página própria com seletor de CRM. Virou seção do dashboard do
 * pipeline porque o recorte sempre foi por CRM — o seletor duplicava uma
 * escolha que a rota já tinha feito.
 */
/*
  Gradientes no mesmo desenho de "Leads por etapa" e "Leads por origem" do
  dashboard do pipeline — é a mesma tela, e duas linguagens de barra ali
  fariam o leitor procurar um significado que não existe.
*/
const WIN_FILL = 'bg-gradient-to-r from-emerald-600 to-teal-500';
const LOSS_FILL = 'bg-gradient-to-r from-rose-600 to-red-500';
const DWELL_FILL = 'bg-gradient-to-r from-blue-600 to-indigo-500';

/** Ganho, perda e aberto — na ordem das colunas do gráfico de coorte. */
/**
 * As três partes da coorte, na ordem em que empilham.
 *
 * Rótulo, cor e valor saem daqui tanto para a barra quanto para a legenda:
 * em listas separadas bastava mexer numa para elas discordarem.
 */
const COHORT_PARTS = [
  { label: 'Ganhos', color: '#059669', pick: (c: FunnelDashboard['cohort']) => c.won },
  { label: 'Perdidos', color: '#dc2626', pick: (c: FunnelDashboard['cohort']) => c.lost },
  { label: 'Em aberto', color: '#3b82f6', pick: (c: FunnelDashboard['cohort']) => c.open },
];

export function FunnelSections({ crmId }: { crmId: number }) {
  const query = useFunnelDashboard(crmId);

  if (query.isPending) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Não foi possível carregar o funil"
        error={query.error}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <FunnelBody data={query.data.data} meta={query.data.meta} />
  );
}

function FunnelBody({ data, meta }: { data: FunnelDashboard; meta: DashboardMeta }) {
  // Denominador comum das barras de motivo: o total de perdas atribuídas.
  const lostReasonTotal = data.lost_reasons.reduce((sum, reason) => sum + reason.count, 0);

  // Denominador comum das barras de origem: o canal que mais fechou.
  const maxClosedBySource = Math.max(
    1,
    ...data.conversion_by_source.map((row) => row.won + row.lost),
  );

  const hasLostReasons = data.lost_reasons.length > 0;
  const hasSourceConversion = data.conversion_by_source.length > 0;
  /*
    Um dos dois pode não existir — sem perdas na janela, ou sem etapas de
    ganho e perda marcadas. Sozinho, o card ocupa as duas colunas: meia tela
    com a outra metade vazia parece defeito, não escolha.
  */
  const pairSpan = hasLostReasons && hasSourceConversion ? '' : ' lg:col-span-2';

  // Escala comum das barras de tempo: o p90 mais alto entre as etapas.
  const maxDwellSeconds = Math.max(
    1,
    ...data.dwell_closed.map((step) => step.p90_seconds ?? step.median_seconds ?? 0),
  );

  const progressionRows = useMemo<ChartRow[]>(
    () => data.progression.map((step) => [step.name, step.reached]),
    [data.progression],
  );

  return (
    <>
      <SetupNotice requirements={meta.setup_required} />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card
          icon={<Trophy className="h-4 w-4" />}
          label="Ganhos"
          value={String(data.closing.won)}
          help="Leads que entraram numa etapa marcada como ganho e tiveram o fechamento carimbado dentro da janela. Quem foi ganho antes e só agora você olhou não entra — o que conta é a data de fechamento."
        />
        <Card
          icon={<TrendingDown className="h-4 w-4" />}
          label="Perdidos"
          value={String(data.closing.lost)}
          help="Mesma regra dos ganhos, para etapas marcadas como perda. Reabrir um lead perdido tira ele desta conta e apaga a data de fechamento."
        />
        <Card
          icon={<Coins className="h-4 w-4" />}
          label="Receita"
          value={formatCents(data.closing.revenue_cents, meta.currency)}
          hint={`${data.closing.won_with_value} de ${data.closing.won} ganhos com valor`}
          help="Soma do valor dos negócios ganhos na janela. Lead ganho sem valor preenchido entra como zero aqui — a linha abaixo diz quantos dos ganhos tinham valor, e é por ela que dá para saber o quanto este número está subestimado."
        />
        <Card
          icon={<Timer className="h-4 w-4" />}
          label="Ciclo (mediana)"
          value={formatDuration(data.closing.cycle_seconds_median)}
          hint={
            data.closing.cycle_approximated > 0
              ? `${data.closing.cycle_approximated} fora por data aproximada`
              : `${data.closing.cycle_sample_size} negócios`
          }
          help="Mediana do tempo entre a entrada do lead e o fechamento, só para os ganhos. Mediana e não média: um negócio arrastado de oito meses distorceria a média e não diz nada sobre o caso típico. Ganhos cuja data de entrada veio aproximada ficam de fora e são contados à parte."
        />
      </section>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fechamento na janela</h2>
          <MetricHelp label="Fechamento na janela">
            A janela aqui é a de <strong>fechamento</strong>, não a de criação: um lead que
            entrou em janeiro e foi ganho neste mês conta aqui, e um criado neste mês que
            ainda negocia não conta. Por isso os números deste bloco não fecham com a
            coorte de entrada logo abaixo — são perguntas diferentes.
          </MetricHelp>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          Negócios cuja data de fechamento caiu no período, independente de quando entraram.
        </p>

        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                Taxa de fechamento
              </dt>
              <MetricHelp label="Taxa de fechamento">
                Ganhos dividido por ganhos mais perdidos — quem ainda está negociando fica de
                fora do divisor de propósito. Incluí-lo faria a taxa cair sozinha em mês de
                muita entrada e subir sozinha em mês parado, que é o contrário do que ela
                deveria indicar. Abaixo de 10 fechamentos o percentual não aparece: com amostra
                menor que isso ele oscila demais para significar alguma coisa.
              </MetricHelp>
            </div>
            <dd className="mt-1">
              <RatioValue metric={data.closing.win_rate} />
            </dd>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Ganhos sobre ganhos mais perdidos. Quem ainda negocia fica fora.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <dt className="text-[11px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                Ticket médio
              </dt>
              <MetricHelp label="Ticket médio">
                Receita dividida pelos ganhos <strong>com valor preenchido</strong>, não por
                todos os ganhos. Lead ganho sem valor não é negócio de zero reais — é dado
                faltando, e dividir por ele achataria o ticket artificialmente.
              </MetricHelp>
            </div>
            <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {data.closing.avg_ticket_cents === null
                ? '—'
                : formatCents(data.closing.avg_ticket_cents, meta.currency)}
            </dd>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Receita dividida pelos ganhos <strong>com valor preenchido</strong>.
            </p>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Coorte de entrada ({data.cohort.entered} leads)
          </h2>
          <MetricHelp label="Coorte de entrada">
            Pega só quem <strong>entrou</strong> na janela e mostra onde cada um está hoje.
            É o acompanhamento de uma safra, então os três números sempre somam o total de
            entradas. Coorte recente aparece quase toda em aberto: os leads ainda não
            tiveram tempo de fechar, e é por isso que a progressão por etapa some quando a
            janela é muito nova.
          </MetricHelp>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          Quem <strong>entrou</strong> na janela e onde está hoje — recorte diferente do bloco acima.
        </p>

        {data.cohort.entered === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Nenhum lead entrou na janela.</p>
        ) : (
          <>
            {/*
              Uma barra empilhada de três partes — exatamente o que o `BarMeter`
              do `BarRow` já desenha. O gráfico do Google aqui gastava 52px de
              gutter com o rótulo "Coorte" (categoria única, informação zero),
              mais eixo e gridlines, e sobrava meia tela de celular vazia. Sem
              ele a composição ocupa a largura toda e fica igual aos vizinhos.
            */}
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
              <div
                className="flex h-full"
                role="img"
                aria-label={`Coorte de ${data.cohort.entered} leads: ${data.cohort.won} ganhos, ${data.cohort.lost} perdidos, ${data.cohort.open} em aberto.`}
              >
                {COHORT_PARTS.map((part) => {
                  const value = part.pick(data.cohort);

                  return value > 0 ? (
                    <div
                      key={part.label}
                      className="h-full"
                      style={{
                        width: `${(value / Math.max(1, data.cohort.entered)) * 100}%`,
                        backgroundColor: part.color,
                      }}
                    />
                  ) : null;
                })}
              </div>
            </div>

            {/*
              A barra nunca é a única fonte: os números saem em texto logo
              abaixo, e é por eles que alguém confere. Com o marcador de cor,
              esta linha **é** a legenda.
            */}
            <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              {COHORT_PARTS.map((part) => (
                <li key={part.label} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: part.color }}
                    aria-hidden="true"
                  />
                  {part.label}: <strong className="tabular-nums">{part.pick(data.cohort)}</strong>
                </li>
              ))}
            </ul>
          </>
        )}

        {!data.cohort.is_mature && data.cohort.entered > 0 && (
          <p className="mt-4 rounded-lg border border-zinc-950/[0.07] bg-zinc-50 p-3 text-[13px] text-zinc-600 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-zinc-400">
            A progressão por etapa aparece quando a coorte amadurece ({meta.thresholds.maturity_days} dias).
            Antes disso, os leads ainda estão no meio do caminho e a coorte pareceria pior do que é.
          </p>
        )}
      </section>

      {data.progression.length > 0 && (
        <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Progressão por etapa</h2>
          <MetricHelp label="Progressão por etapa">
            Quantos da coorte <strong>passaram</strong> por cada etapa em algum momento, não
            quantos estão nela agora. Quem pulou etapas conta como tendo passado por elas,
            então a curva nunca sobe da esquerda para a direita. Serve para achar onde a
            queda é brusca, não para ler conversão etapa a etapa.
          </MetricHelp>
        </div>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            Quantos da coorte alcançaram cada etapa em algum momento. É progressão, não conversão:
            quem pulou etapas conta como tendo passado por elas.
          </p>

          <div className="mt-2">
            <GoogleChart
              type="ColumnChart"
              columns={['Etapa', 'Alcançaram']}
              rows={progressionRows}
              colors={['#3b82f6']}
              ariaLabel={data.progression.map((s) => `${s.name}: ${s.reached}`).join('; ')}
            />
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Tempo por etapa — mediana das passagens concluídas
          </h2>
          <MetricHelp label="Tempo por etapa — mediana das passagens concluídas">
            Mediana e p90 do tempo que os leads levaram para <strong>sair</strong> de cada
            etapa, dentro da janela. Quem está parado na etapa agora fica de fora: a
            passagem dele ainda não terminou, e incluí-la puxaria o número para cima só
            por causa do tempo que passa. O <code>n</code> à direita é quantas passagens
            entraram na conta — com n baixo, a mediana oscila muito.
            <br />
            <br />
            Não confunda com <strong>Permanência média</strong>, lá em cima: aquela é
            média, cobre todo o histórico e inclui quem está parado agora. Esta é mediana,
            na janela, só de travessia concluída.
          </MetricHelp>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          Lead parado na etapa atual não entra: é observação aberta e só cresce com o tempo.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-4 rounded-full ${DWELL_FILL}`} />
            Mediana
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-4 rounded-full opacity-30 ${DWELL_FILL}`} />
            até o p90
          </span>
          <span className="font-mono text-[10px] tabular-nums sm:ml-auto">
            escala até {formatDuration(maxDwellSeconds)}
          </span>
        </div>

        {/*
          Uma linha por etapa, com a barra entre o nome e os números — em vez de
          duas colunas independentes, que repetiam o nome da etapa e não
          alinhavam as linhas entre si.

          Etapa sem passagem concluída fica com o trilho vazio em vez de sumir:
          a ausência de observação é informação, e tirá-la da lista faria o
          funil parecer ter menos etapas.
        */}
        <div className="mt-4 space-y-2.5">
          {data.dwell_closed.map((step) => (
            <BarRow
              key={step.step_id}
              label={step.name}
              title={step.name}
              max={maxDwellSeconds}
              segments={[{ value: step.median_seconds ?? 0, className: DWELL_FILL }]}
              tail={{ value: step.p90_seconds ?? step.median_seconds ?? 0, className: DWELL_FILL }}
              value={
                <>
                  <span className="whitespace-nowrap">
                    {step.n === 0
                      ? '—'
                      : `${formatDuration(step.median_seconds)} · p90 ${formatDuration(step.p90_seconds)}`}
                  </span>
                  <span className="ml-2.5 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                    n = {step.n}
                  </span>
                </>
              }
            />
          ))}
        </div>
      </section>

      {/*
        Lado a lado a partir de `lg`, como "Leads por etapa" e "Leads por
        origem" logo acima: são dois gráficos de composição do mesmo tamanho, e
        empilhados obrigavam a rolar para comparar um com o outro.

        `items-start` impede que o card curto estique até a altura do longo.
      */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {hasLostReasons && (
          <section className={`rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]${pairSpan}`}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Motivos de perda</h2>
              <MetricHelp label="Motivos de perda">
                Por que os negócios perdidos na janela foram perdidos. O motivo é escolhido na
                hora de mover o lead para uma etapa de perda; quem não escolher cai em
                <strong>Outro</strong>. Se quase tudo estiver em "Outro", o problema não é o
                gráfico — é que o motivo não está sendo preenchido.
              </MetricHelp>
            </div>

            {/*
              O total das perdas é o denominador de todas as linhas, não o maior
              motivo: com `max = maior`, o motivo líder viraria sempre uma barra
              cheia e a composição desapareceria.
            */}
            <div className="mt-4 space-y-2.5">
              {data.lost_reasons.map((reason) => (
                <BarRow
                  key={reason.id ?? 'none'}
                  label={reason.name}
                  title={reason.name}
                  max={lostReasonTotal}
                  segments={[{ value: reason.count, className: LOSS_FILL }]}
                  value={
                    <>
                      {reason.count}
                      <span className="ml-2 w-9 text-[11px] font-normal text-zinc-400 dark:text-zinc-500">
                        {Math.round((reason.count / Math.max(1, lostReasonTotal)) * 100)}%
                      </span>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {hasSourceConversion && (
          <section className={`rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]${pairSpan}`}>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Conversão por origem</h2>
              <MetricHelp label="Conversão por origem">
                Dos negócios <strong>fechados</strong> na janela, quantos vieram de cada canal e
                quantos deles foram ganhos. A janela é a de fechamento, então não divida isto
                pelo volume de entrada do mês — daria taxa acima de 100% num mês de muitos
                fechamentos antigos. Cada linha traz o próprio <code>n</code>.
              </MetricHelp>
            </div>
            {/*
              Única parte do antigo dashboard de origens que sobreviveu: o volume
              por canal já existia no relatório de fontes, mas a conversão não.
              Fica aqui porque depende de etapas de ganho e perda, que são do
              pipeline — e a janela é a de FECHAMENTO, não a de criação.
            */}
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Negócios <strong>fechados</strong> na janela, por origem do lead.
            </p>

            {/* Legenda: sem ela as duas cores da barra são adivinhação. */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-4 rounded-full ${WIN_FILL}`} />
                Ganhos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-4 rounded-full ${LOSS_FILL}`} />
                Perdidos
              </span>
            </div>

            {/*
              O comprimento da barra compara **volume** entre canais (denominador
              comum: o canal que mais fechou); a proporção dentro dela mostra a
              conversão. Normalizar cada barra a 100% esconderia que um canal de 2
              negócios está ao lado de um de 80.
            */}
            <div className="mt-4 space-y-2.5">
              {data.conversion_by_source.map((row) => (
                <BarRow
                  key={row.label}
                  label={row.label}
                  title={row.label}
                  labelClassName={row.source === null ? 'italic text-zinc-500 dark:text-zinc-400' : undefined}
                  max={maxClosedBySource}
                  segments={[
                    { value: row.won, className: WIN_FILL },
                    { value: row.lost, className: LOSS_FILL },
                  ]}
                  value={
                    <>
                      <span className="font-normal text-zinc-400 dark:text-zinc-500">
                        {row.won}/{row.won + row.lost}
                      </span>
                      <span className="ml-2.5 inline-block w-14 text-right">
                        <RatioValue metric={row.win_rate} showSample={false} compact />
                      </span>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>


      <section className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Confiança dos números</h2>
          <MetricHelp label="Confiança dos números">
            Quanto do cadastro deste pipeline está preenchido. Cobertura baixa não é defeito
            do sistema: é dado que ninguém digitou. Ao contrário das taxas acima, estes dois
            números <strong>nunca são escondidos</strong> por amostra pequena — esconder
            "1 de 3" apagaria justamente o aviso.
          </MetricHelp>
        </div>
        {/*
          O que sobrou do antigo dashboard "Saúde dos dados". Cobertura baixa
          não é defeito de software: é dado que ninguém preencheu — e saber
          disso antes de olhar receita evita decisão tomada sobre metade da
          realidade.

          Ao contrário das taxas acima, estas NÃO são suprimidas por amostra
          pequena: esconder "1 de 3 leads tem valor" apagaria exatamente o
          aviso que o número existe para dar.
        */}
        <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
          Sobre os {data.coverage.live_leads} leads ativos deste pipeline — não só os da janela.
        </p>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Com valor preenchido</dt>
              <MetricHelp label="Com valor preenchido">
                Quantos dos leads vivos deste pipeline têm valor. É o teto de confiança da
                receita e do ticket médio: com 40% de cobertura, a receita mostrada é no máximo
                40% da real.
              </MetricHelp>
            </div>
            <dd className="mt-1">
              <RatioValue metric={data.coverage.value} />
            </dd>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              Receita e ticket médio valem o que vale esta cobertura.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Com origem registrada</dt>
              <MetricHelp label="Com origem registrada">
                Quantos dos leads vivos têm canal de origem. Os demais caem na linha
                "(não informado)" da conversão por origem — não somem, mas também não ajudam a
                decidir onde investir.
              </MetricHelp>
            </div>
            <dd className="mt-1">
              <RatioValue metric={data.coverage.source} />
            </dd>
            <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
              O resto cai na linha "(não informado)" da conversão por origem.
            </p>
          </div>
        </dl>
      </section>

    </>
  );
}

function Card({
  icon,
  label,
  value,
  hint,
  help,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  help: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-950/[0.07] bg-white p-4 dark:border-white/[0.07] dark:bg-[#17171a]">
      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
        {icon}
        <span className="min-w-0 truncate text-[11px] uppercase tracking-[0.1em]">{label}</span>
        <MetricHelp label={label}>{help}</MetricHelp>
      </div>
      <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </div>
  );
}

/** Segundos em dias/horas. Nulo vira travessão, nunca zero. */
function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }

  const days = Math.floor(seconds / 86400);

  if (days >= 1) {
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  const hours = Math.max(1, Math.round(seconds / 3600));

  return `${hours}h`;
}
