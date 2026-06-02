import Dashboard from './Dashboard';
import PageHeader from '../components/ui/PageHeader';
import { ROLE_LABELS } from '../auth';

export default function RoleDashboard({ roleKey, description }) {
  const title = ROLE_LABELS[roleKey] || 'Dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${title} Dashboard`}
        description={description || `Welcome to your ${title.toLowerCase()} workspace`}
        breadcrumbs={[title, 'Dashboard']}
      />
      <Dashboard />
    </div>
  );
}
