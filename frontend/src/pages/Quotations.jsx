import { Routes, Route, Navigate } from 'react-router-dom';
import { QuotationListPage, QuotationBuilderWizard } from '../components/quotations';
import PermissionRoute from '../components/PermissionRoute';

function QuotationsIndex() {
  return <QuotationListPage />;
}

export default function Quotations() {
  return (
    <Routes>
      <Route index element={<QuotationsIndex />} />
      <Route
        path="new"
        element={
          <PermissionRoute module="quotations" action="create">
            <QuotationBuilderWizard mode="executive" />
          </PermissionRoute>
        }
      />
      <Route path="*" element={<Navigate to="/quotations" replace />} />
    </Routes>
  );
}
