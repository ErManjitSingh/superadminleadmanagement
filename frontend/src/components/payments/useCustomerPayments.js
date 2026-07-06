import { useCallback, useEffect, useState } from 'react';
import { getCustomerPayments } from '../../services/bookingPaymentsApi';

const EMPTY_KPIS = {
  totalCollection: 0,
  receivedAmount: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  completedBookings: 0,
  partialPayments: 0,
  trends: {},
};

export function useCustomerPayments(filters = {}) {
  const [payments, setPayments] = useState([]);
  const [kpis, setKpis] = useState(EMPTY_KPIS);
  const [filterOptions, setFilterOptions] = useState({ destinations: [], executives: [], branches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.method && filters.method !== 'all') params.method = filters.method;
      if (filters.destination && filters.destination !== 'all') params.destination = filters.destination;
      if (filters.executive && filters.executive !== 'all') params.executive = filters.executive;
      if (filters.branch && filters.branch !== 'all') params.branch = filters.branch;

      const data = await getCustomerPayments(params);
      setPayments(data.payments || []);
      setKpis(data.kpis || EMPTY_KPIS);
      setFilterOptions(data.filters || { destinations: [], executives: [], branches: [] });
    } catch (err) {
      setPayments([]);
      setKpis(EMPTY_KPIS);
      setError(err?.message || 'Failed to load customer payments');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, filters.method, filters.destination, filters.executive, filters.branch]);

  useEffect(() => {
    load();
  }, [load]);

  return { payments, kpis, filterOptions, loading, error, reload: load };
}
