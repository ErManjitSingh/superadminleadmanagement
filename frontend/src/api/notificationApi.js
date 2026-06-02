import API from './axios';

export async function fetchNotifications(limit = 50) {
  const { data } = await API.get('/notifications', {
    params: { limit },
    skipSuccessToast: true,
    skipErrorToast: true,
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchUnreadCount() {
  const { data } = await API.get('/notifications/unread-count', {
    skipSuccessToast: true,
    skipErrorToast: true,
  });
  return typeof data?.count === 'number' ? data.count : 0;
}

export async function markNotificationRead(id) {
  if (!id) return null;
  const { data } = await API.put(`/notifications/${id}/read`, {}, {
    skipSuccessToast: true,
    skipErrorToast: true,
    skipDataRefresh: true,
  });
  return data;
}

export async function markAllNotificationsRead() {
  await API.put('/notifications/read-all', {}, {
    skipSuccessToast: true,
    skipErrorToast: true,
    skipDataRefresh: true,
  });
}
