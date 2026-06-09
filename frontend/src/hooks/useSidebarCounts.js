import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { useDataRefresh } from './useDataRefresh';
import { NAV_COUNTS_STALE_MS, GC_TIME_MS } from '../lib/queryConfig';
import { invalidateNavCounts } from '../lib/queryInvalidation';

export function useSidebarCounts(enabled = true) {
  const { user } = useAuth();
  const { selectedBranchId } = useSelector((s) => s.branch);
  const queryClient = useQueryClient();
  const userId = user?._id;

  const query = useQuery({
    queryKey: ['nav-counts', userId, user?.role, selectedBranchId || 'all'],
    queryFn: async () => {
      const { data } = await API.get('/nav-counts', {
        skipSuccessToast: true,
        skipErrorToast: true,
      });
      return data;
    },
    enabled: enabled && !!userId,
    staleTime: NAV_COUNTS_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
    retry: 2,
    refetchOnMount: true,
  });

  const refresh = useCallback(() => {
    invalidateNavCounts(queryClient);
  }, [queryClient]);

  useDataRefresh(['nav-counts'], refresh, enabled && !!userId);

  useEffect(() => {
    if (!enabled || !userId) return undefined;
    const onUnread = () => refresh();
    window.addEventListener('notifications:unread', onUnread);
    return () => window.removeEventListener('notifications:unread', onUnread);
  }, [enabled, userId, refresh]);

  return query.data ?? null;
}
