import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import PackageManagementPage from '../components/packages/PackageManagementPage';
import PremiumPackageBuilder from '../components/packages/builder/PremiumPackageBuilder';
import PermissionRoute from '../components/PermissionRoute';

function EditPackageRoute() {
  const { id } = useParams();
  return <PremiumPackageBuilder packageId={id} />;
}

function NewPackageRoute() {
  return (
    <PermissionRoute module="packages" action="create">
      <PremiumPackageBuilder />
    </PermissionRoute>
  );
}

export default function Packages() {
  return (
    <Routes>
      <Route index element={<PackageManagementPage />} />
      <Route path="new" element={<NewPackageRoute />} />
      <Route path=":id/edit" element={<EditPackageRoute />} />
      <Route path="*" element={<Navigate to="/packages" replace />} />
    </Routes>
  );
}
