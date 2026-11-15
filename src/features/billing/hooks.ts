import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreatePaymentMethodPayload,
  CreatePlanPayload,
  CreateSubscriptionPayload,
} from '@/src/lib/types';

import { useInfiniteList } from '@/src/lib/useInfiniteList';

export function usePlansInfiniteQuery(perPage = 25) {
  return useInfiniteList(
    queryKeys.plans.all,
    (page, size) => api.listPlans(page, size),
    perPage,
  );
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

export function useSubscriptionsInfiniteQuery(perPage = 25) {
  return useInfiniteList(
    queryKeys.subscriptions.all,
    (page, size) => api.listSubscriptions(page, size),
    perPage,
  );
}

export function useCreateSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPayload) => api.createSubscription(payload),
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

export function useInvoicesInfiniteQuery(perPage = 25) {
  return useInfiniteList(
    queryKeys.invoices.all,
    (page, size) => api.listInvoices(page, size),
    perPage,
  );
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

export function usePaymentMethodsInfiniteQuery(perPage = 25) {
  return useInfiniteList(
    queryKeys.paymentMethods.all,
    (page, size) => api.listPaymentMethods(page, size),
    perPage,
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
