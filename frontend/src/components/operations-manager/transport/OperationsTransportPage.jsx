import { useEffect, useState } from 'react';
import { Car, Plane } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { formatINR } from '../operationsUtils';
import { cn } from '../../../lib/utils';

export default function OperationsTransportPage() {
  const [data, setData] = useState({ cabs: [], flights: [] });
  const [tab, setTab] = useState('cabs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/transport').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const list = tab === 'cabs' ? data.cabs : data.flights;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Transport Management" description="Cab fleet and flight inventory for trip execution" breadcrumbs={['Operations', 'Transport']} />

      <div className="flex gap-2 p-1 rounded-xl border border-subtle bg-surface w-fit">
        {[
          { id: 'cabs', label: 'Cabs', icon: Car },
          { id: 'flights', label: 'Flights', icon: Plane },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id ? 'bg-teal-600 text-white shadow-sm' : 'text-content-muted hover:text-content-primary',
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-content-muted animate-pulse">Loading...</div>
        ) : tab === 'cabs' ? (
          <table className="w-full">
            <thead><tr className="border-b border-subtle bg-surface-elevated/50">
              {['Vehicle', 'Pickup', 'Drop', 'Cost'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-subtle">
              {data.cabs.map((c) => (
                <tr key={c._id} className="hover:bg-teal-500/[0.03]">
                  <td className="px-4 py-3.5 font-medium">{c.vehicleType}</td>
                  <td className="px-4 py-3.5 text-sm">{c.pickupLocation}</td>
                  <td className="px-4 py-3.5 text-sm">{c.dropLocation}</td>
                  <td className="px-4 py-3.5 font-bold tabular-nums">{formatINR(c.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-subtle bg-surface-elevated/50">
              {['Airline', 'Flight', 'Route', 'Cost'].map((h) => <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-subtle">
              {data.flights.map((f) => (
                <tr key={f._id} className="hover:bg-teal-500/[0.03]">
                  <td className="px-4 py-3.5 font-medium">{f.airline}</td>
                  <td className="px-4 py-3.5 font-mono text-sm">{f.flightNumber}</td>
                  <td className="px-4 py-3.5 text-sm">{f.departure} → {f.arrival}</td>
                  <td className="px-4 py-3.5 font-bold tabular-nums">{formatINR(f.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
