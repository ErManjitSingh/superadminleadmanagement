import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PaymentsUiContext = createContext(null);

export function PaymentsUiProvider({ children }) {
  const [selectedPayment, setSelectedPayment] = useState(null);

  const openPayment = useCallback((payment) => setSelectedPayment(payment), []);
  const closePayment = useCallback(() => setSelectedPayment(null), []);

  const value = useMemo(
    () => ({ selectedPayment, openPayment, closePayment }),
    [selectedPayment, openPayment, closePayment]
  );

  return <PaymentsUiContext.Provider value={value}>{children}</PaymentsUiContext.Provider>;
}

export function usePaymentsUi() {
  const ctx = useContext(PaymentsUiContext);
  if (!ctx) throw new Error('usePaymentsUi must be used within PaymentsUiProvider');
  return ctx;
}
