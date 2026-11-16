import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreateCheckoutPayload,
  CreatePaymentMethodPayload,
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

export function useCreateCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) => api.createCheckout(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

/** Força a reconciliação quando o webhook do Mercado Pago não chegou. */
export function useSyncSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.syncSubscription(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all });
    },
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.cancelSubscription(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
    },
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

export function usePaymentMethodsFullQuery() {
  return useFullList(queryKeys.paymentMethods.all, (page, size) =>
    api.listPaymentMethods(page, size),
  );
}

export function useCreatePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentMethodPayload) => api.createPaymentMethod(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
    },
  });
}

export function useDeletePaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePaymentMethod(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
    },
  });
}

export function useSetDefaultPaymentMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.setDefaultPaymentMethod(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods.all });
    },
  });
}
