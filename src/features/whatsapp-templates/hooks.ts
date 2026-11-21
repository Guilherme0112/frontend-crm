import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateWhatsappTemplateInput, UpdateWhatsappTemplateInput } from '@/src/lib/types';

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

export function useWhatsappTemplatesQuery(_page = 1, _perPage = 10, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.whatsappTemplates.all,
    queryFn: () => api.listWhatsappTemplates(),
    enabled,
  });
  return {
    ...query,
    data: query.data ? asListResult(query.data) : undefined,
  };
}

export function useWhatsappTemplatesInfiniteQuery(_perPage = 25, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.whatsappTemplates.all,
    queryFn: () => api.listWhatsappTemplates(),
    enabled,
  });
  const items = query.data ?? [];
  return {
    ...query,
    data: { pages: [asListResult(items)], pageParams: [1] },
    items,
    meta: asListResult(items).meta,
    total: items.length,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: async () => query,
  };
}

export function useCreateWhatsappTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWhatsappTemplateInput) => api.createWhatsappTemplate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappTemplates.all });
    },
  });
}

export function useUpdateWhatsappTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWhatsappTemplateInput }) =>
      api.updateWhatsappTemplate(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappTemplates.all });
    },
  });
}

export function useDeleteWhatsappTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteWhatsappTemplate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.whatsappTemplates.all });
    },
  });
}
