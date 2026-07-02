import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../shared/api/client';
import type { Resource, Week } from '../../../shared/types';

export const useWeeks = (cohortId?: string) => {
  return useQuery<Week[]>({
    queryKey: ['weeks', cohortId],
    queryFn: () => apiClient.get(cohortId ? `/weeks?cohort_id=${cohortId}` : '/weeks'),
  });
};

export const useCreateWeek = () => {
  const queryClient = useQueryClient();
  return useMutation<Week, Error, Partial<Week> & { cohort_id: string }>({
    mutationFn: (data) => apiClient.post('/weeks', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weeks'] }),
  });
};

export const usePublishWeek = () => {
  const queryClient = useQueryClient();
  return useMutation<Week, Error, string>({
    mutationFn: (id) => apiClient.post(`/weeks/${id}/publish`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weeks'] }),
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  return useMutation<Resource, Error, Partial<Resource> & { week_id: string }>({
    mutationFn: (data) => apiClient.post('/resources', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weeks'] }),
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: (id) => apiClient.delete(`/resources/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weeks'] }),
  });
};
