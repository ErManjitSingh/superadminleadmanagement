import { useEffect, useMemo, useState } from 'react';
import { listPayments } from '../../services/paymentsApi';
import { DEMO_CUSTOMER_PAYMENTS } from './paymentsDemoData';
import { normalizeApiPayment } from './paymentsUtils';

export function useCustomerPayments() {
  const [apiPayments, setApiPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await listPayments();
        if (alive) setApiPayments(rows.map(normalizeApiPayment).filter(Boolean));
      } catch {
        if (alive) setApiPayments([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const payments = useMemo(() => {
    if (apiPayments.length > 0) return apiPayments;
    return DEMO_CUSTOMER_PAYMENTS;
  }, [apiPayments]);

  return { payments, loading, fromApi: apiPayments.length > 0 };
}
