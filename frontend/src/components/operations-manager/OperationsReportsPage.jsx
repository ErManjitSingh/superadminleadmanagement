import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import { formatINR } from './operationsUtils';

export default function OperationsReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/reports').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { summary, bookingsByStatus, monthlyTrips, vendorPerformance } = data || {};

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Operations Reports" description="Fulfillment metrics, vendor performance & trip analytics" breadcrumbs={['Operations', 'Reports']} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: summary?.totalBookings },
          { label: 'Fulfillment Rate', value: `${summary?.fulfillmentRate}%` },
          { label: 'Avg Trip Value', value: formatINR(summary?.avgTripValue) },
          { label: 'Active Vendors', value: summary?.activeVendors },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-subtle bg-surface/80 p-5">
            <p className="text-xs font-semibold uppercase text-content-muted">{s.label}</p>
            <p className="text-2xl font-black text-content-primary mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
          <h3 className="font-bold mb-4">Monthly Trips</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrips}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="trips" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
          <h3 className="font-bold mb-4">Bookings by Status</h3>
          <div className="space-y-3">
            {bookingsByStatus?.map((b) => (
              <div key={b.status} className="flex items-center gap-3">
                <span className="text-sm capitalize w-24 text-content-secondary">{b.status}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-elevated overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(b.count / (summary?.totalBookings || 1)) * 100}%` }} />
                </div>
                <span className="text-sm font-bold tabular-nums">{b.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
        <h3 className="font-bold mb-4">Vendor Performance</h3>
        <table className="w-full">
          <thead><tr className="border-b border-subtle">
            {['Vendor', 'Rating', 'Bookings Handled'].map((h) => <th key={h} className="text-left px-4 py-2 text-[11px] font-semibold uppercase text-content-muted">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-subtle">
            {vendorPerformance?.map((v) => (
              <tr key={v.name}>
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 text-amber-600 font-bold">★ {v.rating}</td>
                <td className="px-4 py-3 tabular-nums">{v.bookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
