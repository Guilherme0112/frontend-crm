import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreateCheckoutPayload,
  CreatePlanPayload,
} from '@/src/lib/types';

import { useFullList } from '@/src/lib/useInfiniteList';

/**
 * Planos, assinaturas e métodos de pagamento vêm inteiros: a tela de
 * faturamento precisa do conjunto completo para achar a assinatura ativa,
 * resolver o nome do plano no histórico e montar o seletor de método no
 * modal de contratação. A paginação dessas três listas é feita no cliente.
 */
export function usePlansFullQuery() {
  return useFullList(queryKeys.plans.all, (page, size) => api.listPlans(page, size));
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => api.createPlan(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
  });
}

export function useSubscriptionsFullQuery() {
  return useFullList(queryKeys.subscriptions.all, (page, size) =>
    api.listSubscriptions(page, size),
  );
}

/**
 * Mexer na assinatura muda o plano exibido no dashboard e pode gerar fatura.
 * Uma troca de plano reescreve as duas assinaturas de uma vez, então o cache
 * dessas três listas sempre cai junto.
 */
function invalidateBilling(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
}

export function useCreateCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) => api.createCheckout(payload),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

/** Troca de plano na assinatura existente, sem redigitar cartão. */
export function useChangePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) => api.changeSubscriptionPlan(payload),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

/**
 * Contratação aguardando pagamento. Busca o link no gateway, então só roda
 * quando há de fato uma pendência a resolver.
 */
export function usePendingCheckoutQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.subscriptions.pending,
    queryFn: () => api.getPendingCheckout(),
    enabled,
  });
}

export function useDiscardPendingCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.discardPendingCheckout(),
    onSuccess: () => {
      invalidateBilling(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.pending });
    },
  });
}

/** Chave pública do gateway. Não muda em runtime, então fica em cache longo. */
export function useBillingConfigQuery() {
  return useQuery({
    queryKey: queryKeys.billing.config,
    queryFn: () => api.getBillingConfig(),
    staleTime: Infinity,
  });
}

/** Força a reconciliação quando o webhook do Mercado Pago não chegou. */
export function useSyncSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.syncSubscription(id),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.cancelSubscription(id),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

const INVOICES_PER_PAGE = 10;

export function useInvoicesQuery(page = 1, perPage = INVOICES_PER_PAGE) {
  return useQuery({
    queryKey: queryKeys.invoices.list(page, perPage),
    queryFn: () => api.listInvoices(page, perPage),
    placeholderData: keepPreviousData,
  });
}

export function usePayInvoiceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.payInvoice(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

