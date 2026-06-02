import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import DashboardPanel from '../dashboard/DashboardPanel';
import { REVENUE_PERIODS } from './constants';
import { formatINR } from './reportUtils';
import { cn } from '../../lib/utils';

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-subtle bg-surface px-3 py-2 shadow-lg text-sm">
      <p className="text-xs text-content-muted">{label}</p>
      <p className="font-bold text-content-primary">{formatINR(payload[0].value)}</p>
    </div>
  );
}

export default function RevenueAnalyticsChart({ revenue }) {
  const [period, setPeriod] = useState('monthly');
  const { isDark } = useTheme();
  const data = revenue[period] || [];
  const grid = isDark ? '#1f2937' : '#f1f5f9';
  const tick = isDark ? '#64748b' : '#94a3b8';
  const isBar = period === 'daily' || period === 'weekly';

  return (
    <DashboardPanel
      title="Revenue Analytics"
      subtitle="Daily · Weekly · Monthly · Yearly trends"
      action={
        <div className="flex rounded-lg border border-subtle p-0.5 bg-surface-elevated">
          {REVENUE_PERIODS.map((p) => (
            <button key={p.id} type="button" onClick={() => setPeriod(p.id)} className={cn('px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all', period === p.id ? 'bg-indigo-600 text-white' : 'text-content-muted hover:text-content-primary')}>
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {isBar ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatINR(v)} tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revAnalytics" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatINR(v)} tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revAnalytics)" dot={false} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  );
}
