import { useEffect, useState } from 'react';
import { getPaymentsDashboard } from '../../services/bookingPaymentsApi';

export function usePaymentsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    return getPaymentsDashboard()
      .then(setData)
      .catch((e) => {
        setError(e);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return { data, loading, error, reload: load };
}
