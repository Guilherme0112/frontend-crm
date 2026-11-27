import { Link } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import type { SetupRequirement } from '@/src/lib/types';

/**
 * Mostrado no lugar de um gráfico quando falta configuração.
 *
 * A distinção importa: zero significa "medi e deu zero"; falta de configuração
 * significa "não dá para medir ainda". Um gráfico zerado confunde os dois e
 * parece defeito do sistema, quando na verdade é um passo que ninguém deu.
 */
const EXPLAIN: Record<SetupRequirement, { title: string; body: string; action?: { label: string; to: string } }> = {
  steps_kind: {
    title: 'Marque quais etapas são ganho e perda',
    body:
      'Sem saber quais etapas representam negócio fechado e negócio perdido, não há como calcular conversão, '
      + 'receita nem ciclo de venda. Nenhum número aqui seria confiável.',
    action: { label: 'Configurar pipelines', to: '/crms' },
  },
  owner: {
    title: 'Nenhum lead tem responsável',
    body:
      'A visão por vendedor precisa de um responsável no lead. Enquanto ninguém for atribuído, só a atividade '
      + 'registrada aparece — carteira e resultado individual ficam vazios.',
    action: { label: 'Ver leads', to: '/crms' },
  },
  lost_reasons: {
    title: 'Nenhum motivo de perda cadastrado',
    body:
      'Toda perda está caindo em "Outro", então o gráfico de causa não distingue nada. Cadastre os '
      + 'motivos que a equipe usa de verdade e eles passam a ser oferecidos ao mover um lead para uma '
      + 'etapa de perda.',
    action: { label: 'Cadastrar motivos', to: '/crms?motivos=1' },
  },
};

export function SetupNotice({ requirements }: { requirements: SetupRequirement[] }) {
  if (requirements.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {requirements.map((requirement) => {
        const info = EXPLAIN[requirement];

        if (!info) {
          return null;
        }

        return (
          <div
            key={requirement}
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-start dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <Settings2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{info.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed">{info.body}</p>

              {info.action && (
                <Link
                  to={info.action.to}
                  className="mt-2 inline-flex text-[13px] font-medium underline underline-offset-2"
                >
                  {info.action.label}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
