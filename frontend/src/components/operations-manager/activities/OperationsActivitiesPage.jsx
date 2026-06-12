import { useEffect, useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import OperationsDataTable from '../ui/OperationsDataTable';
import { formatINR } from '../operationsUtils';

export default function OperationsActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/activities').then((r) => setActivities(r.data)).finally(() => setLoading(false));
  }, []);

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Activity',
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 ring-1 ring-teal-500/10">
            <Compass className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-semibold">{a.name}</span>
        </div>
      ),
    },
    { key: 'destination', header: 'Destination', render: (a) => a.destination || '—' },
    { key: 'duration', header: 'Duration', render: (a) => a.duration || '—' },
    { key: 'vendorName', header: 'Vendor', className: 'text-content-secondary', render: (a) => a.vendorName || '—' },
    {
      key: 'price',
      header: 'Price',
      render: (a) => <span className="font-bold tabular-nums text-teal-700">{formatINR(a.price)}</span>,
    },
  ], []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Activities" description="Tours, excursions and experience inventory" breadcrumbs={['Operations', 'Activities']} />

      <OperationsDataTable
        columns={columns}
        data={activities}
        loading={loading}
        emptyIcon={Compass}
        emptyTitle="No activities in inventory"
        emptyDescription="Tours and experiences will appear here once configured."
        footer={activities.length ? `${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}` : undefined}
      />
    </div>
  );
}
