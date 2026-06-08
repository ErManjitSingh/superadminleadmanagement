import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../executiveUtils';

export default function TargetTracker({ target }) {
  if (!target) return null;

  const bars = target.weeklyRevenue || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white">
          <Target className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-content-primary">Monthly Target Tracker</h3>
          <p className="text-xs text-content-muted">Revenue vs target · {target.progress}% achieved</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-content-secondary">{formatCurrency(target.revenueAchieved)} achieved</span>
          <span className="font-semibold text-content-primary">{formatCurrency(target.monthlyTarget)} target</span>
        </div>
        <div className="h-3 rounded-full bg-surface-elevated overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(target.progress, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Converted', value: target.leadsConverted },
          { label: 'Conversion %', value: `${target.conversionRate}%` },
          { label: 'Remaining', value: formatCurrency(Math.max(0, target.monthlyTarget - target.revenueAchieved)) },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-xl bg-surface-elevated/50 border border-subtle text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-content-muted">{label}</p>
            <p className="text-lg font-bold text-content-primary tabular-nums mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-2">
        <TrendingUp className="w-3.5 h-3.5" /> Weekly Revenue
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="currentColor" className="text-content-muted" />
            <YAxis tick={{ fontSize: 10 }} stroke="currentColor" className="text-content-muted" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border-subtle)' }} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {bars.map((_, i) => (
                <Cell key={i} fill={i === bars.length - 1 ? '#10B981' : '#0EA5E9'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
