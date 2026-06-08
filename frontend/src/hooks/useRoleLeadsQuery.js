import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';
import { buildListParams, unwrapPagination } from '../utils/apiHelpers';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

async function fetchRoleLeads(endpoint, { page, limit, filter, search }) {
  const { data } = await API.get(endpoint, {
    params: buildListParams({
      page,
      limit,
      filters: {
        filter: filter && filter !== 'all' ? filter : undefined,
        search: search || undefined,
      },
    }),
    skipSuccessToast: true,
  });
  return unwrapPagination(data);
}

export function useRoleLeadsQuery({
  endpoint,
  filter,
  search = '',
  page = 1,
  limit = 25,
  enabled = true,
}) {
  const debouncedSearch = useDebouncedValue(search, 350);

  return useQuery({
    queryKey: ['leads', endpoint, { filter, search: debouncedSearch, page, limit }],
    queryFn: () =>
      fetchRoleLeads(endpoint, {
        page,
        limit,
        filter,
        search: debouncedSearch,
      }),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });
}
