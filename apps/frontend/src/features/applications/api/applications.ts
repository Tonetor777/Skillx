import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Application } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const useApplications = () => {
  return useQuery<Application[]>({
    queryKey: ['applications'],
    queryFn: () => apiClient.get('/applications'),
  });
};

export const useApplication = (id: string | undefined) => {
  return useQuery<Application>({
    queryKey: ['applications', id],
    queryFn: () => apiClient.get(`/applications/${id}`),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, Partial<Application> | FormData>({
    mutationFn: (data) => apiClient.post('/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useApproveApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, { id: string; cohort_id: string }>({
    mutationFn: ({ id, cohort_id }) => apiClient.post(`/applications/${id}/approve`, { cohort_id }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });
};

export const useRejectApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, string>({
    mutationFn: (id) => apiClient.post(`/applications/${id}/reject`, {}),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
    },
  });
};

export const useReinviteApplication = () => {
  const queryClient = useQueryClient();
  return useMutation<Application, Error, string>({
    mutationFn: (id) => apiClient.post(`/applications/${id}/reinvite`, {}),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
    },
  });
};
