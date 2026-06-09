import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../../../services/leadsApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { LIST_STALE_MS, GC_TIME_MS } from '../../../lib/queryConfig';

export function useLeadsQuery({ filters, page, limit, sortBy, sortOrder, cursor, enabled = true }) {
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const queryFilters = {
    ...filters,
    search: debouncedSearch,
  };

  return useQuery({
    queryKey: ['leads', { filters: queryFilters, page, limit, sortBy, sortOrder, cursor: cursor || null }],
    queryFn: () => fetchLeads({ page, limit, sortBy, sortOrder, cursor, filters: queryFilters }),
    enabled,
    staleTime: LIST_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
  });
}
