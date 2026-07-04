import { Navigate, Route, Routes } from 'react-router-dom';
import { PaymentsUiProvider } from '../components/payments/PaymentsContext';
import PaymentDetailDrawer from '../components/payments/PaymentDetailDrawer';
import PaymentDashboard from '../components/payments/PaymentDashboard';
import CustomerPaymentsPage from '../components/payments/CustomerPaymentsPage';
import SupplierPaymentsPage from '../components/payments/SupplierPaymentsPage';
import PendingPaymentsPage from '../components/payments/PendingPaymentsPage';
import RefundsPage from '../components/payments/RefundsPage';
import InvoicesPage from '../components/payments/InvoicesPage';
import PaymentLinksPage from '../components/payments/PaymentLinksPage';
import TransactionsPage from '../components/payments/TransactionsPage';
import PaymentReportsPage from '../components/payments/PaymentReportsPage';
import PaymentSettingsPage from '../components/payments/PaymentSettingsPage';

export default function Payments() {
  return (
    <PaymentsUiProvider>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PaymentDashboard />} />
        <Route path="customers" element={<CustomerPaymentsPage />} />
        <Route path="suppliers" element={<SupplierPaymentsPage />} />
        <Route path="pending" element={<PendingPaymentsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="links" element={<PaymentLinksPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="reports" element={<PaymentReportsPage />} />
        <Route path="settings" element={<PaymentSettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
      <PaymentDetailDrawer />
    </PaymentsUiProvider>
  );
}
