import { useQuery } from '@tanstack/react-query';
import { fetchGlobalAuditLog } from '../../../services/leadEnterpriseApi';
import { LIST_STALE_MS, GC_TIME_MS } from '../../../lib/queryConfig';

export function useGlobalAuditQuery({ page = 1, limit = 30, action = '', enabled = true } = {}) {
  return useQuery({
    queryKey: ['audit-log', { page, limit, action: action || null }],
    queryFn: () => fetchGlobalAuditLog({ page, limit, action: action || undefined }),
    enabled,
    staleTime: LIST_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
  });
}
