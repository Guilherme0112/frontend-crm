import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreateSendingTemplatePayload,
  UpdateSendingTemplatePayload,
} from '@/src/lib/types';

export function useSendingTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: api.listSendingTemplates,
  });
}

export function useCreateSendingTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSendingTemplatePayload) =>
      api.createSendingTemplate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}

export function useUpdateSendingTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateSendingTemplatePayload;
    }) => api.updateSendingTemplate(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}

export function useDeleteSendingTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSendingTemplate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}
