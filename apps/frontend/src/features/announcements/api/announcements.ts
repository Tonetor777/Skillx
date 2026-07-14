import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Announcement } from '../../../shared/types';
import apiClient from '../../../shared/api/client';

export const useAnnouncements = (filters?: { target_type?: string; target_id?: string }) => {
  return useQuery<Announcement[]>({
    queryKey: ['announcements', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.target_type) params.set('target_type', filters.target_type);
      if (filters?.target_id) params.set('target_id', filters.target_id);
      const query = params.toString() ? `?${params.toString()}` : '';
      return apiClient.get(`/announcements${query}`);
    },
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation<Announcement, Error, Partial<Announcement>>({
    mutationFn: (data) => apiClient.post('/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-unread-count'] });
    },
  });
};

export const useAnnouncementUnreadCount = (enabled = true) => {
  return useQuery<{ count: number }>({
    queryKey: ['announcement-unread-count'],
    queryFn: () => apiClient.get('/announcements/unread-count'),
    enabled,
  });
};

export const useMarkAnnouncementRead = () => {
  const queryClient = useQueryClient();
  return useMutation<{ is_read: boolean }, Error, string>({
    mutationFn: (id) => apiClient.post(`/announcements/${id}/mark-read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-unread-count'] });
    },
  });
};

export const useMarkAllAnnouncementsRead = () => {
  const queryClient = useQueryClient();
  return useMutation<{ marked_read: number; count: number }, Error, void>({
    mutationFn: () => apiClient.post('/announcements/mark-all-read', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-unread-count'] });
    },
  });
};
