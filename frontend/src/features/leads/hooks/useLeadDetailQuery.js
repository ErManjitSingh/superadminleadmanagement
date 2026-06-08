import { useQuery } from '@tanstack/react-query';
import API from '../../../api/axios';
import { fetchLeadTimeline } from '../../../services/leadEnterpriseApi';
import { DETAIL_STALE_MS, GC_TIME_MS } from '../../../lib/queryConfig';

export function useLeadQuery(leadId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      const { data } = await API.get(`/leads/${leadId}`, {
        params: { followupsLimit: 20 },
        skipSuccessToast: true,
      });
      return data;
    },
    enabled: Boolean(leadId) && enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: GC_TIME_MS,
  });
}

export function useLeadTimelineQuery(leadId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['lead-timeline', leadId],
    queryFn: () => fetchLeadTimeline(leadId, { limit: 30 }),
    enabled: Boolean(leadId) && enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: GC_TIME_MS,
  });
}
