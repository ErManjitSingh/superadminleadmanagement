import { useQuery } from '@tanstack/react-query';
import { fetchQuotations, fetchQuotationStats } from '../../../services/quotationsApi';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

export function useQuotationsQuery({
  filters = {},
  page = 1,
  limit = 25,
  endpoint = '/quotations',
  enabled = true,
}) {
  const debouncedSearch = useDebouncedValue(filters.search, 350);

  return useQuery({
    queryKey: ['quotations', endpoint, { filters: { ...filters, search: debouncedSearch }, page, limit }],
    queryFn: () =>
      fetchQuotations(
        {
          page,
          limit,
          filters: {
            search: debouncedSearch,
            status: filters.status || undefined,
            destination: filters.destination || undefined,
            executiveId: filters.executiveId || undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
          },
        },
        endpoint
      ),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useQuotationStatsQuery(enabled = true) {
  return useQuery({
    queryKey: ['quotations', 'stats'],
    queryFn: fetchQuotationStats,
    enabled,
    staleTime: 60_000,
  });
}
