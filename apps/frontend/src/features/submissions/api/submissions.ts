import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Submission } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

type SubmissionFilters = {
  assignmentId?: string;
  studentId?: string;
};

export const useSubmissions = (filtersOrAssignmentId?: string | SubmissionFilters) => {
  const filters: SubmissionFilters = typeof filtersOrAssignmentId === 'string'
    ? { assignmentId: filtersOrAssignmentId }
    : filtersOrAssignmentId ?? {};

  return useQuery<Submission[]>({
    queryKey: ['submissions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.assignmentId) params.set('assignment_id', filters.assignmentId);
      if (filters.studentId) params.set('student_id', filters.studentId);
      const query = params.toString() ? `?${params.toString()}` : '';
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};
