import { useQuery } from '@tanstack/react-query';
import {
  getFunnelDashboard,
  getTeamDashboard,
  getDispatchHealthDashboard,
  getMyDayDashboard,
  type MyDayPages,
} from '@/src/lib/dashboards';
import { queryKeys } from '@/src/lib/queryKeys';

/**
 * Nenhum destes dashboards tem `refetchInterval`.
 *
 * São leituras agregadas sobre as tabelas transacionais, sem cache no servidor
 * (decisão da v1): atualizar sozinho a cada poucos segundos multiplicaria a
 * carga sem nada mudar na tela — leads não entram de minuto em minuto. O
 * `meta.generated_at` no rodapé diz a idade do dado, e o usuário recarrega
 * quando quiser.
 */
const STALE_MS = 60_000;

export function useMyDayDashboard(pages: MyDayPages = {}, crmId?: number) {
  return useQuery({
    queryKey: queryKeys.dashboards.myDay(crmId, pages),
    queryFn: () => getMyDayDashboard(crmId, pages),
    staleTime: STALE_MS,
    // Mantém a página anterior visível enquanto a próxima carrega: sem isso a
    // lista pisca em branco a cada clique na paginação.
    placeholderData: (previous) => previous,
  });
}


export function useDispatchHealthDashboard(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.dashboards.dispatchHealth(from, to),
    queryFn: () => getDispatchHealthDashboard({ from, to }),
    staleTime: STALE_MS,
  });
}

export function useFunnelDashboard(crmId?: number, from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.dashboards.funnel(crmId, from, to),
    queryFn: () => getFunnelDashboard(crmId as number, { from, to }),
    // Sem pipeline escolhido não há funil: a query nem sai.
    enabled: Boolean(crmId),
    staleTime: STALE_MS,
  });
}

export function useTeamDashboard(crmId?: number, from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.dashboards.team(crmId, from, to),
    queryFn: () => getTeamDashboard({ crm_id: crmId, from, to }),
    staleTime: STALE_MS,
  });
}
