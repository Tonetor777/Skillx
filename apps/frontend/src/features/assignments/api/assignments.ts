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
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<Assignment, Error, { id: string; data: Partial<Assignment> }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/assignments/${id}`, data),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', assignment.id] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<Assignment | null, Error, string>({
    mutationFn: (id) => apiClient.delete(`/assignments/${id}`),
    onSuccess: (assignment, id) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', assignment?.id ?? id] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};
