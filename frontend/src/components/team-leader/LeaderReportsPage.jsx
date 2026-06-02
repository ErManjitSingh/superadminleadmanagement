import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import ExportActions from '../reports/ExportActions';
import { formatCurrency } from './leaderUtils';

export default function LeaderReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/team-leader/reports').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-content-muted">Loading reports…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Reports"
        description="Team performance, executive breakdown, and conversion analytics"
        breadcrumbs={['Team Leader', 'Reports']}
        actions={<ExportActions data={data} />}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Leads', value: data.teamPerformance.totalLeads },
          { label: 'Conversions', value: data.teamPerformance.conversions },
          { label: 'Revenue', value: formatCurrency(data.teamPerformance.revenue) },
          { label: 'Avg CR', value: `${data.teamPerformance.avgConversionRate}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-subtle bg-surface/80 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">{label}</p>
            <p className="text-xl font-bold text-content-primary mt-1 tabular-nums">{value}</p>
          </div>
        ))}
      </motion.div>

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

        <ReportCard title="Team Performance Report">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-subtle">{['Executive', 'Leads', 'F/U', 'Quotes', 'Conv.', 'Revenue', 'CR %'].map((h) => <th key={h} className="text-left py-2 text-[11px] font-semibold uppercase text-content-muted">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-subtle">
              {data.executives.map((ex) => (
                <tr key={ex._id}>
                  <td className="py-2.5 font-medium">{ex.name}</td>
                  <td>{ex.assignedLeads}</td>
                  <td>{ex.followUpsDone}</td>
                  <td>{ex.quotationsSent}</td>
                  <td>{ex.conversions}</td>
                  <td className="font-semibold">{formatCurrency(ex.revenue)}</td>
                  <td className="text-emerald-600">{ex.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ReportCard>

        <ReportCard title="Executive Report — Revenue Share">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.executives}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>

        <ReportCard title="Conversion Report">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.conversions} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
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
      </div>
    </div>
  );
}

function ReportCard({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5">
      <h3 className="font-bold text-content-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
