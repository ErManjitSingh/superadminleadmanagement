import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import DashboardPanel from '../dashboard/DashboardPanel';
import { formatINR } from './reportUtils';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f59e0b'];

export default function DestinationReports({ data }) {
  const { isDark } = useTheme();
  const grid = isDark ? '#1f2937' : '#f1f5f9';
  const tick = isDark ? '#64748b' : '#94a3b8';

  return (
    <DashboardPanel title="Destination Reports" subtitle="Leads, conversions & revenue by destination">
      <div className="h-[280px] mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="destination" width={80} tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v, name) => [name === 'revenue' ? formatINR(v) : v, name === 'revenue' ? 'Revenue' : name === 'conversions' ? 'Conversions' : 'Leads']} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {data.map((d, i) => (
          <div key={d.destination} className="p-3 rounded-xl border border-subtle bg-surface-elevated/30">
            <p className="text-xs font-bold text-content-primary">{d.destination}</p>
            <p className="text-[10px] text-content-muted mt-0.5">{d.leads} leads · {d.conversions} conv.</p>
            <p className="text-sm font-bold metric-tabular mt-1" style={{ color: COLORS[i % COLORS.length] }}>{formatINR(d.revenue)}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
