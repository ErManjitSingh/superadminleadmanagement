import { useQuery } from '@tanstack/react-query';
import API from '../../../api/axios';
import { DASHBOARD_STALE_MS, GC_TIME_MS } from '../../../lib/queryConfig';

export function useDashboardQuery(endpoint = '/dashboard/stats') {
  return useQuery({
    queryKey: ['dashboard', endpoint],
    queryFn: async () => {
      const { data } = await API.get(endpoint, { skipSuccessToast: true });
      return data;
    },
    staleTime: DASHBOARD_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
  });
}
