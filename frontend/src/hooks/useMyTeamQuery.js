import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';
import { DASHBOARD_STALE_MS, GC_TIME_MS } from '../lib/queryConfig';

export function useMyTeamQuery(enabled = true) {
  return useQuery({
    queryKey: ['team-leader', 'my-team'],
    queryFn: async () => {
      const { data } = await API.get('/team-leader/my-team', { skipSuccessToast: true });
      return data || { team: null, members: [], message: null };
    },
    enabled,
    staleTime: DASHBOARD_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
  });
}
