import { useEffect, useMemo, useState } from 'react';
import { Hotel } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import OperationsDataTable from '../ui/OperationsDataTable';
import { formatINR } from '../operationsUtils';

export default function OperationsHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/hotels').then((r) => setHotels(r.data)).finally(() => setLoading(false));
  }, []);

  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Hotel',
      render: (h) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 ring-1 ring-teal-500/10">
            <Hotel className="w-4 h-4 text-teal-600" />
          </div>
          <span className="font-semibold">{h.name}</span>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (h) => h.category || '—' },
    { key: 'location', header: 'Location', className: 'text-content-secondary', render: (h) => h.location || '—' },
    { key: 'roomType', header: 'Room Type', render: (h) => h.roomType || h.roomTypes?.[0]?.name || '—' },
    { key: 'mealPlan', header: 'Meal Plan', render: (h) => h.mealPlan || '—' },
    {
      key: 'price',
      header: 'Price / Night',
      render: (h) => (
        <span className="font-bold tabular-nums text-teal-700">{formatINR(h.price ?? h.roomTypes?.[0]?.baseRate)}</span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Hotel Inventory" description="Manage hotel partners for trip confirmations" breadcrumbs={['Operations', 'Hotels']} />

      <OperationsDataTable
        columns={columns}
        data={hotels}
        loading={loading}
        emptyIcon={Hotel}
        emptyTitle="No hotels in inventory"
        emptyDescription="Add hotel partners to confirm stays for upcoming trips."
        footer={hotels.length ? `${hotels.length} hotel${hotels.length === 1 ? '' : 's'} in inventory` : undefined}
      />
    </div>
  );
}
