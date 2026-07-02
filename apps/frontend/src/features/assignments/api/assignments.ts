import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Assignment } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const useAssignments = (cohortId?: string) => {
  return useQuery<Assignment[]>({
    queryKey: ['assignments', { cohortId }],
    queryFn: async () => {
      const query = cohortId ? `?cohort_id=${encodeURIComponent(cohortId)}` : '';
      return apiClient.get(`/assignments${query}`);
    },
  });
};

export const useAssignment = (id: string | undefined) => {
  return useQuery<Assignment>({
    queryKey: ['assignments', id],
    queryFn: () => apiClient.get(`/assignments/${id}`),
    enabled: !!id,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<Assignment, Error, Partial<Assignment>>({
    mutationFn: (data) => apiClient.post('/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};
