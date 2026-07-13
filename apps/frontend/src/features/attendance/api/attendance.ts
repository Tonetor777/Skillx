import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../shared/api/client';
import type { AttendanceSession, AttendanceStatus, CohortGradeSettings, DashboardSummary } from '../../../shared/types';

export const useAttendanceSessions = (cohortId?: string) => {
  return useQuery<AttendanceSession[]>({
    queryKey: ['attendance-sessions', { cohortId }],
    queryFn: async () => {
      const query = cohortId ? `?cohort_id=${encodeURIComponent(cohortId)}` : '';
      return apiClient.get(`/attendance-sessions${query}`);
    },
    enabled: !!cohortId,
  });
};

export const useCreateAttendanceSession = () => {
  const queryClient = useQueryClient();
  return useMutation<AttendanceSession, Error, { cohort_id: string; date: string; title?: string }>({
    mutationFn: (data) => apiClient.post('/attendance-sessions', data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions', { cohortId: session.cohort_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};

export const useSaveAttendanceRecords = () => {
  const queryClient = useQueryClient();
  return useMutation<AttendanceSession, Error, { sessionId: string; records: Array<{ student_id: string; status: AttendanceStatus; note?: string }> }>({
    mutationFn: ({ sessionId, records }) => apiClient.post(`/attendance-sessions/${sessionId}/records`, { records }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-sessions', { cohortId: session.cohort_id }] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};

export const useCohortGradeSettings = (cohortId?: string) => {
  return useQuery<CohortGradeSettings>({
    queryKey: ['cohort-grade-settings', cohortId],
    queryFn: () => apiClient.get(`/cohorts/${cohortId}/grade-settings`),
    enabled: !!cohortId,
  });
};

export const useUpdateCohortGradeSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<CohortGradeSettings, Error, { cohortId: string; assignment_weight: number; attendance_weight: number }>({
    mutationFn: ({ cohortId, assignment_weight, attendance_weight }) => apiClient.patch(`/cohorts/${cohortId}/grade-settings`, { assignment_weight, attendance_weight }),
    onSuccess: (_settings, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cohort-grade-settings', variables.cohortId] });
      queryClient.invalidateQueries({ queryKey: ['cohorts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
};

export const useDashboardSummary = () => {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get('/dashboard/summary'),
  });
};
