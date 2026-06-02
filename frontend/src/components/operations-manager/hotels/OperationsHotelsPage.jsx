import { useEffect, useState } from 'react';
import { Hotel } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import { formatINR } from '../operationsUtils';

export default function OperationsHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/hotels').then((r) => setHotels(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Hotel Inventory" description="Manage hotel partners for trip confirmations" breadcrumbs={['Operations', 'Hotels']} />

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-content-muted animate-pulse">Loading hotels...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-subtle bg-surface-elevated/50">
                  {['Hotel', 'Category', 'Location', 'Room Type', 'Meal Plan', 'Price/Night'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {hotels.map((h) => (
                  <tr key={h._id} className="hover:bg-teal-500/[0.03]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-teal-500/10"><Hotel className="w-4 h-4 text-teal-600" /></div>
                        <span className="font-medium">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm">{h.category}</td>
                    <td className="px-4 py-3.5 text-sm text-content-secondary">{h.location}</td>
                    <td className="px-4 py-3.5 text-sm">{h.roomType}</td>
                    <td className="px-4 py-3.5 text-sm">{h.mealPlan}</td>
                    <td className="px-4 py-3.5 font-bold tabular-nums">{formatINR(h.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
