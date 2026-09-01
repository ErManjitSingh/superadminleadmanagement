import { apiClient } from '@/src/lib/apiClient';

export async function registerPushToken(token: string) {
  const { data } = await apiClient.post('/auth/push-token', { token });
  return data;
}

export async function fetchNotificationsList(params: { page?: number; limit?: number } = {}) {
  const { data } = await apiClient.get('/notifications', {
    params: { page: params.page ?? 1, limit: params.limit ?? 30 },
  });
  const items = data.items || data.notifications || data.data || data || [];
  return {
    items: Array.isArray(items) ? items : [],
    total: Number(data.total ?? items.length),
  };
}

export async function fetchUnreadCount() {
  const { data } = await apiClient.get('/notifications/unread-count');
  return Number(data.count ?? data.unread ?? 0);
}

export async function markNotificationRead(id: string) {
  const { data } = await apiClient.put(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.put('/notifications/read-all');
  return data;
}
