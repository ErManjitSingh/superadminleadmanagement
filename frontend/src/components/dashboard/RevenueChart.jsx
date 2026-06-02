import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import DashboardPanel from './DashboardPanel';

function formatCurrency(value) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${(value / 1000).toFixed(0)}K`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-subtle bg-surface px-3 py-2 shadow-lg text-sm">
      <p className="text-content-muted text-xs">{label}</p>
      <p className="font-bold text-content-primary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export default function RevenueChart({ data }) {
  const { isDark } = useTheme();
  const latest = data[data.length - 1]?.revenue || 0;
  const grid = isDark ? '#1f2937' : '#f1f5f9';
  const tick = isDark ? '#64748b' : '#94a3b8';

  return (
    <DashboardPanel
      title="Revenue"
      subtitle="Monthly closed deals"
      action={
        <div className="text-right">
          <p className="text-xl font-bold text-content-primary metric-tabular">{formatCurrency(latest)}</p>
          <p className="text-xs text-emerald-600 font-medium">+18.2%</p>
        </div>
      }
      className="h-full"
    >
      <div className="h-[260px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCurrency} tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#revGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DashboardPanel>
  );
}
