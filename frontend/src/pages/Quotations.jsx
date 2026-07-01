import { Routes, Route, Navigate } from 'react-router-dom';
import { QuotationListPage, QuotationBuilderWizard } from '../components/quotations';
import PermissionRoute from '../components/PermissionRoute';
import { useAuth } from '../context/AuthContext';

function QuotationsIndex() {
  return <QuotationListPage />;
}

function NewQuotationRoute() {
  const { user } = useAuth();
  const mode = user?.role === 'admin' ? 'admin' : 'executive';

  return (
    <PermissionRoute module="quotations" action="create">
      <QuotationBuilderWizard mode={mode} />
    </PermissionRoute>
  );
}

export default function Quotations() {
  return (
    <Routes>
      <Route index element={<QuotationsIndex />} />
      <Route path="new" element={<NewQuotationRoute />} />
      <Route path="*" element={<Navigate to="/quotations" replace />} />
    </Routes>
  );
}
