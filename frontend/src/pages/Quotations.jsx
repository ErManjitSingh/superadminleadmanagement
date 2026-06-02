import { Routes, Route } from 'react-router-dom';
import { QuotationListPage, QuotationBuilderWizard } from '../components/quotations';

function QuotationsIndex() {
  return <QuotationListPage />;
}

export default function Quotations() {
  return (
    <Routes>
      <Route index element={<QuotationsIndex />} />
      <Route path="new" element={<QuotationBuilderWizard />} />
    </Routes>
  );
}
