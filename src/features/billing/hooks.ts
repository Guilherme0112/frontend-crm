import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreatePaymentMethodPayload,
  CreatePlanPayload,
  CreateSubscriptionPayload,
} from '@/src/lib/types';

export function usePlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.all,
    queryFn: api.listPlans,
  });
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

export function useSubscriptionsQuery() {
  return useQuery({
    queryKey: queryKeys.subscriptions.all,
    queryFn: api.listSubscriptions,
  });
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

export function useInvoicesQuery() {
  return useQuery({
    queryKey: queryKeys.invoices.all,
    queryFn: api.listInvoices,
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

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: queryKeys.paymentMethods.all,
    queryFn: api.listPaymentMethods,
  });
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
