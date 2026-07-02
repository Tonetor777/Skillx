import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Submission } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const useSubmissions = (assignmentId?: string) => {
  return useQuery<Submission[]>({
    queryKey: ['submissions', { assignmentId }],
    queryFn: async () => {
      const query = assignmentId ? `?assignment_id=${encodeURIComponent(assignmentId)}` : '';
      return apiClient.get(`/submissions${query}`);
    },
  });
};

export const useSubmission = (id: string | undefined) => {
  return useQuery<Submission>({
    queryKey: ['submissions', id],
    queryFn: () => apiClient.get(`/submissions/${id}`),
    enabled: !!id,
  });
};

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation<Submission, Error, { assignment_id: string; content: string }>({
    mutationFn: (data) => apiClient.post('/submissions', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation<Submission, Error, { id: string; grade: number; feedback: string }>({
    mutationFn: ({ id, grade, feedback }) => apiClient.post(`/submissions/${id}/grade`, { grade, feedback }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['submissions', variables.id] });
    },
  });
};
