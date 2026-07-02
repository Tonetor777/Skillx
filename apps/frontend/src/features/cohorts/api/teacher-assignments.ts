import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../shared/api/client';
import type { TeacherAssignment } from '../../../shared/types';

export const useTeacherAssignments = (enabled = true) => {
  return useQuery<TeacherAssignment[]>({
    queryKey: ['teacher-assignments'],
    queryFn: () => apiClient.get('/teacher-assignments'),
    enabled,
  });
};

export const useCreateTeacherAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<TeacherAssignment, Error, { teacher_id: string; cohort_id: string; role: string }>({
    mutationFn: (data) => apiClient.post('/teacher-assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });
};

export const useDeleteTeacherAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation<null, Error, string>({
    mutationFn: (id) => apiClient.delete(`/teacher-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
    },
  });
};
