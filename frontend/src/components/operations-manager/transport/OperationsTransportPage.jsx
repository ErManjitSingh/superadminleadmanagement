import { useEffect, useMemo, useState } from 'react';
import { Car, Plane } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import OperationsDataTable from '../ui/OperationsDataTable';
import OperationsFilterTabs from '../ui/OperationsFilterTabs';
import { formatINR } from '../operationsUtils';

const TAB_OPTIONS = [
  { value: 'cabs', label: 'Cabs', icon: Car },
  { value: 'flights', label: 'Flights', icon: Plane },
];

export default function OperationsTransportPage() {
  const [data, setData] = useState({ cabs: [], flights: [] });
  const [tab, setTab] = useState('cabs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/transport').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const list = tab === 'cabs' ? data.cabs : data.flights;

  const columns = useMemo(() => (
    tab === 'cabs'
      ? [
          { key: 'vehicleType', header: 'Vehicle', render: (c) => <span className="font-semibold">{c.vehicleType}</span> },
          { key: 'pickupLocation', header: 'Pickup', render: (c) => c.pickupLocation || '—' },
          { key: 'dropLocation', header: 'Drop', render: (c) => c.dropLocation || '—' },
          {
            key: 'cost',
            header: 'Cost',
            render: (c) => <span className="font-bold tabular-nums text-teal-700">{formatINR(c.cost)}</span>,
          },
        ]
      : [
          { key: 'airline', header: 'Airline', render: (f) => <span className="font-semibold">{f.airline}</span> },
          { key: 'flightNumber', header: 'Flight', className: 'font-mono', render: (f) => f.flightNumber || '—' },
          {
            key: 'route',
            header: 'Route',
            render: (f) => `${f.departure || '—'} → ${f.arrival || '—'}`,
          },
          {
            key: 'cost',
            header: 'Cost',
            render: (f) => <span className="font-bold tabular-nums text-teal-700">{formatINR(f.cost)}</span>,
          },
        ]
  ), [tab]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Transport Management" description="Cab fleet and flight inventory for trip execution" breadcrumbs={['Operations', 'Transport']} />

      <OperationsFilterTabs options={TAB_OPTIONS} value={tab} onChange={setTab} />

      <OperationsDataTable
        columns={columns}
        data={list}
        loading={loading}
        emptyIcon={tab === 'cabs' ? Car : Plane}
        emptyTitle={tab === 'cabs' ? 'No cabs in fleet' : 'No flights in inventory'}
        emptyDescription="Transport options will appear here once configured."
        footer={list.length ? `${list.length} ${tab === 'cabs' ? 'cab' : 'flight'}${list.length === 1 ? '' : 's'}` : undefined}
      />
    </div>
  );
}
