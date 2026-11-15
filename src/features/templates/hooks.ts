import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type {
  CreateSendingTemplatePayload,
  UpdateSendingTemplatePayload,
} from '@/src/lib/types';

const TEMPLATES_PER_PAGE = 10;

export function useSendingTemplatesQuery(page = 1, perPage = TEMPLATES_PER_PAGE, search = '') {
  return useQuery({
    queryKey: queryKeys.templates.list(page, perPage, search),
    queryFn: () => api.listSendingTemplates(page, perPage, search || undefined),
    placeholderData: keepPreviousData,
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
