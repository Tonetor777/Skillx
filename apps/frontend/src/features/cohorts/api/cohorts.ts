import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cohort } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const useCohorts = () => {
  return useQuery<Cohort[]>({
    queryKey: ['cohorts'],
    queryFn: () => apiClient.get('/cohorts'),
  });
};

export const useCohort = (id: string | undefined) => {
  return useQuery<Cohort>({
    queryKey: ['cohorts', id],
    queryFn: () => apiClient.get(`/cohorts/${id}`),
    enabled: !!id,
  });
};

export const useCreateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation<Cohort, Error, Partial<Cohort>>({
    mutationFn: (data) => apiClient.post('/cohorts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });
};

export const useUpdateCohort = () => {
  const queryClient = useQueryClient();
  return useMutation<Cohort, Error, { id: string; data: Partial<Cohort> }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/cohorts/${id}`, data),
    onSuccess: (updatedCohort) => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts', updatedCohort.id] });
    },
  });
};

export const useDeleteCohort = () => {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: (id) => apiClient.delete(`/cohorts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
};
