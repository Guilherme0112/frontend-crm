import { apiClient } from './api';
import type {
  DispatchHealthDashboard,
  MyDayDashboard,
  TeamDashboard,
  FunnelDashboard,
} from './types';

/**
 * Cliente dos dashboards analíticos.
 *
 * Arquivo próprio, separado de `api.ts`: aquele já passa de 800 linhas e serve o
 * CRM inteiro. Mais importante, estes endpoints devolvem **`data` e `meta`**,
 * enquanto todo o resto da API devolve só `data` — o `ApiResponse<T>` de lá
 * descartaria o `meta`, que é metade do contrato aqui.
 */
export interface DashboardEnvelope<T> {
  data: T;
  meta: import('./types').DashboardMeta;
}

/** Uma página por lista: as três do "Meu dia" avançam de forma independente. */
export interface MyDayPages {
  leads_page?: number;
  agenda_page?: number;
  overdue_page?: number;
  per_page?: number;
}

export interface DashboardWindowParams {
  from?: string;
  to?: string;
  crm_id?: number;
}

async function getDashboard<T>(path: string, params?: DashboardWindowParams): Promise<DashboardEnvelope<T>> {
  const res = await apiClient.get<DashboardEnvelope<T>>(`/dashboards/${path}`, { params });

  return res.data;
}

export function getMyDayDashboard(crmId?: number, pages?: MyDayPages) {
  return getDashboard<MyDayDashboard>('my-day', { ...pages, ...(crmId ? { crm_id: crmId } : {}) });
}


export function getDispatchHealthDashboard(params?: DashboardWindowParams) {
  return getDashboard<DispatchHealthDashboard>('dispatch-health', params);
}

export function getFunnelDashboard(crmId: number, params?: DashboardWindowParams) {
  return getDashboard<FunnelDashboard>('funnel', { ...params, crm_id: crmId });
}

export function getTeamDashboard(params?: DashboardWindowParams) {
  return getDashboard<TeamDashboard>('team', params);
}
