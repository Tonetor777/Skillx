import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Program } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const usePrograms = () => {
  return useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: () => apiClient.get('/programs'),
  });
};

export const usePublicPrograms = () => {
  return useQuery<Program[]>({
    queryKey: ['programs', 'public'],
    queryFn: () => apiClient.get('/programs/public'),
  });
};

export const useProgram = (id: string | undefined) => {
  return useQuery<Program>({
    queryKey: ['programs', id],
    queryFn: () => apiClient.get(`/programs/${id}`),
    enabled: !!id,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation<Program, Error, Partial<Program> | FormData>({
    mutationFn: (data) => apiClient.post('/programs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  return useMutation<Program, Error, { id: string; data: Partial<Program> | FormData }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/programs/${id}`, data),
    onSuccess: (updatedProgram) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', updatedProgram.id] });
    },
  });
};

export const useArchiveProgram = () => {
  const queryClient = useQueryClient();
  return useMutation<Program, Error, string>({
    mutationFn: (id) => apiClient.patch(`/programs/${id}/archive`, {}),
    onSuccess: (updatedProgram) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', updatedProgram.id] });
    },
  });
};
