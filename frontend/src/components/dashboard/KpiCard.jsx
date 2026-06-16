import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

export default function KpiCard({
  label,
  value,
  change,
  changeType = 'up',
  icon: Icon,
  iconColor = 'bg-blue-500',
  sparkColor = '#3B82F6',
  sparkData = [],
  index = 0,
  compact = false,
}) {
  const chartData = sparkData.map((v, i) => ({ i, v }));
  const isUp = changeType === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border border-subtle bg-surface shadow-sm',
        'hover:shadow-md transition-all duration-300',
        compact ? 'p-4 min-h-[120px]' : 'p-5 min-h-[148px]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm', iconColor)}>
          <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2} />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-semibold shrink-0',
              isUp ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-content-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-content-primary metric-tabular tracking-tight leading-none mb-1">
        {value}
      </p>
      {change !== undefined && (
        <p className="text-[11px] text-content-muted mb-2">from last month</p>
      )}

      {chartData.length > 0 && (
        <div className="h-10 -mx-1 mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`kpi-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#kpi-${index})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
