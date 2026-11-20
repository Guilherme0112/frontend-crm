import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateCheckoutPayload, CreatePlanPayload } from '@/src/lib/types';

function asListResult<T>(items: T[]) {
  return {
    data: items,
    meta: {
      current_page: 1,
      per_page: items.length || 1,
      total: items.length,
      last_page: 1,
      from: items.length ? 1 : null,
      to: items.length ? items.length : null,
    },
  };
}

export function usePlansFullQuery() {
  const query = useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: () => api.listPlans(),
  });
  const items = query.data ?? [];
  return {
    ...query,
    items,
    data: query.data,
    meta: asListResult(items).meta,
    total: items.length,
  };
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
  const query = useQuery({
    queryKey: queryKeys.subscriptions.all,
    queryFn: () => api.listSubscriptions(),
  });
  const items = query.data ?? [];
  return {
    ...query,
    items,
    data: query.data,
    meta: asListResult(items).meta,
    total: items.length,
  };
}

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

export function useChangePlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckoutPayload) => api.changeSubscriptionPlan(payload),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

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

export function useBillingConfigQuery() {
  return useQuery({
    queryKey: queryKeys.billing.config,
    queryFn: () => api.getBillingConfig(),
    staleTime: Infinity,
  });
}

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

export function useInvoicesQuery(_page = 1, _perPage = 10) {
  const query = useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: () => api.listInvoices(),
  });
  return {
    ...query,
    data: query.data ? asListResult(query.data) : undefined,
  };
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
