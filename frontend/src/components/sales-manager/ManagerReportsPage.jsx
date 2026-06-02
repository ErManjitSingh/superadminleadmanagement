import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import ExportActions from '../reports/ExportActions';
import { formatCurrency } from './managerUtils';

export default function ManagerReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/sales-manager/reports').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-content-muted">Loading reports…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Reports"
        description="Executive performance, lead sources, conversions, and revenue"
        breadcrumbs={['Sales Manager', 'Reports']}
        actions={<ExportActions data={data} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportCard title="Reactivated Lead Report">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              ['Reactivated', data.reactivationWidget?.stageCounts?.reactivated || 0],
              ['Reassigned', data.reactivationWidget?.stageCounts?.reassigned || 0],
              ['Contacted', data.reactivationWidget?.stageCounts?.contacted || 0],
              ['Follow Up', data.reactivationWidget?.stageCounts?.followUpScheduled || 0],
              ['Quotation', data.reactivationWidget?.stageCounts?.quotationSent || 0],
              ['Converted', data.reactivationWidget?.stageCounts?.converted || 0],
            ].map(([label, value]) => (
              <div key={label} className="p-3 rounded-xl bg-surface-elevated/50 text-center">
                <p className="text-[10px] uppercase text-content-muted">{label}</p>
                <p className="text-lg font-bold text-content-primary">{value}</p>
              </div>
            ))}
          </div>
        </ReportCard>

        <ReportCard title="Executive Performance Report">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-subtle">{['Executive', 'Leads', 'Conv.', 'Revenue', 'CR %'].map((h) => <th key={h} className="text-left py-2 text-[11px] font-semibold uppercase text-content-muted">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-subtle">
                {data.executives.map((ex) => (
                  <tr key={ex._id}><td className="py-2.5 font-medium">{ex.name}</td><td>{ex.assignedLeads}</td><td>{ex.conversions}</td><td className="font-semibold">{formatCurrency(ex.revenue)}</td><td className="text-emerald-600">{ex.conversionRate}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>

        <ReportCard title="Lead Source Report">
          <div className="space-y-2">
            {data.leadSources.map((s) => (
              <div key={s.source} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50">
                <div className="flex-1"><p className="font-medium text-sm">{s.source}</p><p className="text-xs text-content-muted">{s.leads} leads · {s.converted} converted</p></div>
                <span className="text-sm font-bold text-emerald-600">{s.rate}%</span>
              </div>
            ))}
          </div>
        </ReportCard>

        <ReportCard title="Conversion Report">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.conversions} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard title="Revenue Report">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenue}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>
      </div>
    </div>
  );
}

function ReportCard({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5">
      <h3 className="text-sm font-bold text-content-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
