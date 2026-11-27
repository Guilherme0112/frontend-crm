import { Activity, Briefcase } from 'lucide-react';
import { MetaFooter } from '@/src/components/dashboards/MetaFooter';
import { MetricHelp } from '@/src/components/dashboards/MetricHelp';
import { RatioValue } from '@/src/components/dashboards/RatioValue';
import { SetupNotice } from '@/src/components/dashboards/SetupNotice';
import { EmptyState } from '@/src/components/common/EmptyState';
import { ErrorState } from '@/src/components/common/ErrorState';
import { Skeleton } from '@/src/components/common/Skeleton';
import { formatCents } from '@/src/lib/format';
import type { TeamActivityRow, TeamPortfolioRow } from '@/src/lib/types';
import { useTeamDashboard } from './hooks';
import { PageHeader } from '@/src/components/layout/PageHeader';

const UNOWNED = '(sem responsável)';

/**
 * D4 "Time".
 *
 * **Carteira e atividade ficam em blocos separados, e isso é regra, não
 * layout.** Resultado e esforço respondem perguntas diferentes; juntá-los num
 * ranking leva a avaliar vendedor por número de cliques. Por isso a tabela de
 * atividade não é ordenável e carrega o rótulo explícito.
 */
export function TeamDashboardPage() {
  const query = useTeamDashboard();

  if (query.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div>
        <ErrorState
          title="Não foi possível carregar o time"
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const { data, meta } = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        trail={[{ to: "/team", label: "Equipe" }]}
        eyebrow="Configurações"
        title="Time"
        description="Carteira e resultado de um lado; atividade registrada do outro."
      />

      <SetupNotice requirements={meta.setup_required} />

      <div className="grid items-start gap-6 2xl:grid-cols-2">
        <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Carteira e resultado</h2>
            <MetricHelp label="Carteira e resultado">
              <strong>Carteira é foto de agora</strong>, resultado é o da janela: os leads em
              aberto de cada pessoa não dependem do período escolhido, mas ganhos e perdidos
              sim. Trocar a janela muda metade da tabela e a outra metade não — é esperado.
              A taxa some quando a pessoa fechou menos de 10 negócios no período.
            </MetricHelp>
          </div>

          {data.portfolio.length === 0 ? (
            <EmptyState title="Nenhum lead" description="Cadastre leads para ver a carteira do time." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                    <th className="py-2 pr-3 font-medium">Responsável</th>
                    <th className="py-2 pr-3 text-right font-medium">Em aberto</th>
                    <th className="py-2 pr-3 text-right font-medium">Valor aberto</th>
                    <th className="py-2 pr-3 text-right font-medium">Ganhos</th>
                    <th className="py-2 text-right font-medium">Fechamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
                  {data.portfolio.map((row) => (
                    <PortfolioRow key={row.user_id ?? 'none'} row={row} currency={meta.currency} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-zinc-950/[0.07] bg-white p-4 sm:p-6 dark:border-white/[0.07] dark:bg-[#17171a]">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Atividade</h2>
            <MetricHelp label="Atividade">
              O que cada pessoa <strong>registrou</strong> na janela: movimentações de etapa e
              compromissos. Não mede esforço nem resultado — mede uso do CRM. Alguém com
              muita venda e pouca atividade aqui está fechando fora do sistema, e é isso que
              deixa os outros dashboards com buraco.
            </MetricHelp>
            {/* O rótulo é parte da regra: estes números medem esforço registrado,
                não desempenho, e a tabela não é ordenável de propósito. */}
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
              Atividade, não desempenho
            </span>
          </div>

          {data.activity.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma movimentação ou reunião registrada na janela.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                    <th className="py-2 pr-3 font-medium">Usuário</th>
                    <th className="py-2 pr-3 text-right font-medium">Movimentos</th>
                    <th className="py-2 pr-3 text-right font-medium">Leads tocados</th>
                    <th className="py-2 text-right font-medium">Comparecimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-950/[0.06] dark:divide-white/[0.06]">
                  {data.activity.map((row) => (
                    <ActivityRow key={row.user_id} row={row} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <MetaFooter meta={meta} />
    </div>
  );
}

function PortfolioRow({ row, currency }: { row: TeamPortfolioRow; currency: string }) {
  return (
    <tr>
      <td className="py-2.5 pr-3">
        <span
          className={
            row.user_id === null
              ? 'italic text-zinc-500 dark:text-zinc-400'
              : 'text-zinc-800 dark:text-zinc-200'
          }
        >
          {row.name ?? UNOWNED}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
        {row.open_leads}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
        {formatCents(row.open_value_cents, currency)}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
        {row.won}
      </td>
      <td className="py-2.5 text-right">
        <RatioValue metric={row.win_rate} showSample={false} />
      </td>
    </tr>
  );
}

function ActivityRow({ row }: { row: TeamActivityRow }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 text-zinc-800 dark:text-zinc-200">{row.name ?? '—'}</td>
      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
        {row.manual_moves}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
        {row.leads_touched}
      </td>
      <td className="py-2.5 text-right">
        <RatioValue metric={row.show_rate} showSample={false} />
      </td>
    </tr>
  );
}
