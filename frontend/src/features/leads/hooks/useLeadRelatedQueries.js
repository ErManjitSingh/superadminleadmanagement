import { useQuery } from '@tanstack/react-query';
import API from '../../../api/axios';
import { DETAIL_STALE_MS, GC_TIME_MS } from '../../../lib/queryConfig';

function unwrapList(data) {
  return {
    items: data?.followups || data?.quotations || data?.notes || data?.data || [],
    total: data?.followUpTotal ?? data?.quotationTotal ?? data?.notesTotal ?? data?.pagination?.total ?? 0,
    pagination: data?.pagination,
  };
}

export function useLeadQuotationsQuery(leadId, { basePath = '/leads', enabled = true } = {}) {
  return useQuery({
    queryKey: ['lead-quotations', basePath, leadId],
    queryFn: async () => {
      const { data } = await API.get(`${basePath}/${leadId}/quotations`, {
        params: { page: 1, limit: 20 },
        skipSuccessToast: true,
      });
      return unwrapList(data);
    },
    enabled: Boolean(leadId) && enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: GC_TIME_MS,
  });
}

export function useLeadNotesQuery(leadId, { basePath = '/leads', enabled = true } = {}) {
  return useQuery({
    queryKey: ['lead-notes', basePath, leadId],
    queryFn: async () => {
      const { data } = await API.get(`${basePath}/${leadId}/notes-list`, {
        params: { page: 1, limit: 20 },
        skipSuccessToast: true,
      });
      return unwrapList(data);
    },
    enabled: Boolean(leadId) && enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: GC_TIME_MS,
  });
}

export function useLeadTimelineQuery(leadId, { enabled = true, limit = 20 } = {}) {
  return useQuery({
    queryKey: ['lead-timeline', leadId, limit],
    queryFn: async () => {
      const { data } = await API.get(`/leads/${leadId}/timeline`, {
        params: { page: 1, limit },
        skipSuccessToast: true,
      });
      return data;
    },
    enabled: Boolean(leadId) && enabled,
    staleTime: DETAIL_STALE_MS,
    gcTime: GC_TIME_MS,
  });
}
