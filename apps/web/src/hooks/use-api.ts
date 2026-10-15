'use client';

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useApiQuery<T>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: () => apiClient.get<T>(url),
    ...options,
  });
}

type MutationMethod = 'post' | 'patch' | 'delete';

export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  method: MutationMethod = 'post',
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    'mutationFn'
  >,
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      switch (method) {
        case 'post':
          return apiClient.post<TData>(url, variables);
        case 'patch':
          return apiClient.patch<TData>(url, variables);
        case 'delete':
          return apiClient.delete<TData>(url);
      }
    },
    ...options,
  });
}
