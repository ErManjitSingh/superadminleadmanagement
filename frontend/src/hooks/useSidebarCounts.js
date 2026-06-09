import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';
import { NAV_COUNTS_STALE_MS, GC_TIME_MS } from '../lib/queryConfig';

export function useSidebarCounts(enabled = true) {
  const query = useQuery({
    queryKey: ['nav-counts'],
    queryFn: async () => {
      const { data } = await API.get('/nav-counts', { skipSuccessToast: true });
      return data;
    },
    enabled,
    staleTime: NAV_COUNTS_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const onUnread = () => query.refetch();
    window.addEventListener('notifications:unread', onUnread);
    return () => window.removeEventListener('notifications:unread', onUnread);
  }, [enabled, query]);

  return query.data ?? null;
}
