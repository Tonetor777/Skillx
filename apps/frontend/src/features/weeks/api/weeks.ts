import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Lesson, Module, Resource } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const useModules = (cohortId?: string) => {
  return useQuery<Module[]>({
    queryKey: ['modules', cohortId],
    queryFn: () => apiClient.get(cohortId ? `/modules?cohort_id=${cohortId}` : '/modules'),
  });
};

export const useCreateModule = () => {
  const queryClient = useQueryClient();
  return useMutation<Module, Error, Partial<Module> & { cohort_id: string }>({
    mutationFn: (data) => apiClient.post('/modules', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });
};

export const useUpdateModule = () => {
  const queryClient = useQueryClient();
  return useMutation<Module, Error, { id: string; data: Partial<Module> }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/modules/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });
};

export const useDeleteModule = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/modules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });
};

export const usePublishModule = () => {
  const queryClient = useQueryClient();
  return useMutation<Module, Error, string>({
    mutationFn: (id) => apiClient.post(`/modules/${id}/publish`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  });
};

export const useLessons = (moduleId?: string) => {
  return useQuery<Lesson[]>({
    queryKey: ['lessons', moduleId],
    queryFn: () => apiClient.get(moduleId ? `/lessons?module_id=${moduleId}` : '/lessons'),
  });
};

export const useCreateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation<Lesson, Error, Partial<Lesson> & { module_id: string }>({
    mutationFn: (data) => apiClient.post('/lessons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();
  return useMutation<Lesson, Error, { id: string; data: Partial<Lesson> }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/lessons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  return useMutation<Resource, Error, Partial<Resource> & { lesson_id: string }>({
    mutationFn: (data) => apiClient.post('/resources', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};

export const useUpdateResource = () => {
  const queryClient = useQueryClient();
  return useMutation<Resource, Error, { id: string; data: Partial<Resource> }>({
    mutationFn: ({ id, data }) => apiClient.patch(`/resources/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete(`/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
    },
  });
};
