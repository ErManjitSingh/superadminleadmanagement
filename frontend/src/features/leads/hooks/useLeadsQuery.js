import { useQuery } from '@tanstack/react-query';
import { fetchLeads, fetchLeadsKanban } from '../../../services/leadsApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export function useLeadsQuery({ filters, page, limit, sortBy, sortOrder, enabled = true }) {
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  const queryFilters = {
    ...filters,
    search: debouncedSearch,
  };

  return useQuery({
    queryKey: ['leads', { filters: queryFilters, page, limit, sortBy, sortOrder }],
    queryFn: () => fetchLeads({ page, limit, sortBy, sortOrder, filters: queryFilters }),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useLeadsKanbanQuery({ filters, enabled = true }) {
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  return useQuery({
    queryKey: ['leads', 'kanban', { filters: { ...filters, search: debouncedSearch } }],
    queryFn: () => fetchLeadsKanban({ filters: { ...filters, search: debouncedSearch } }),
    enabled,
    staleTime: 30_000,
  });
}
