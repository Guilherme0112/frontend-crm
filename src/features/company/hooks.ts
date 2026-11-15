import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/src/lib/api';
import { queryKeys } from '@/src/lib/queryKeys';
import type { UpdateCompanyPayload } from '@/src/lib/types';

export function useCompanyQuery() {
  return useQuery({
    queryKey: queryKeys.company.detail,
    queryFn: api.getCompany,
  });
}

export function useUpdateCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => api.updateCompany(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.company.detail, updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
