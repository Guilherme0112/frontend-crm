import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { CreateWhatsappUnofficialTemplateInput, UpdateWhatsappUnofficialTemplateInput } from '@/src/lib/types';

export function useWhatsappUnofficialTemplatesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.whatsappUnofficialTemplates.all,
    queryFn: () => api.listWhatsappUnofficialTemplates(),
    enabled,
  });
}

export function useWhatsappUnofficialTemplatesInfiniteQuery(_perPage = 25, enabled = true) {
  const query = useWhatsappUnofficialTemplatesQuery(enabled);
  const items = query.data ?? [];
  return {
    ...query,
    items,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: async () => query,
  };
}

export function useCreateWhatsappUnofficialTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWhatsappUnofficialTemplateInput) => api.createWhatsappUnofficialTemplate(payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialTemplates.all }); },
  });
}

export function useUpdateWhatsappUnofficialTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateWhatsappUnofficialTemplateInput }) =>
      api.updateWhatsappUnofficialTemplate(id, payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialTemplates.all }); },
  });
}

export function useDeleteWhatsappUnofficialTemplateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteWhatsappUnofficialTemplate(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: queryKeys.whatsappUnofficialTemplates.all }); },
  });
}
