import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../shared/api/client';

export interface SystemSettings {
  branding_name: string;
  theme: string;
}

export const useSystemSettings = () => {
  return useQuery<SystemSettings>({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings'),
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<SystemSettings, Error, SystemSettings>({
    mutationFn: (data) => apiClient.patch('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};
