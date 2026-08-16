import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

export default function KpiCard({
  label,
  value,
  change,
  changeType = 'up',
  changeLabel = 'from last month',
  subtitle,
  icon: Icon,
  iconColor = 'bg-blue-500',
  sparkColor = '#3B82F6',
  sparkData = [],
  index = 0,
  compact = false,
}) {
  const chartData = sparkData.map((v, i) => ({ i, v }));
  const isUp = changeType === 'up';
  const isNeutral = changeType === 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={cn(
        'group relative flex flex-col justify-between border border-subtle bg-surface shadow-sm',
        'hover:shadow-md transition-all duration-300 min-w-0',
        compact
          ? 'rounded-xl p-2.5 sm:p-3 min-h-0'
          : 'rounded-2xl p-5 min-h-[148px]',
      )}
    >
      <div className={cn('flex items-start justify-between gap-1.5', compact ? 'mb-1.5' : 'mb-3')}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center shrink-0 shadow-sm',
            iconColor,
            compact ? 'w-7 h-7' : 'w-10 h-10',
          )}
        >
          <Icon className={cn('text-white', compact ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]')} strokeWidth={2} />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold shrink-0',
              compact ? 'text-[10px]' : 'text-[11px]',
              isNeutral ? 'text-content-muted' : isUp ? 'text-emerald-600' : 'text-red-500',
            )}
          >
            {!isNeutral && (isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />)}
            {change}
          </span>
        )}
      </div>

      <p className={cn('font-medium text-content-muted truncate', compact ? 'text-[10px] mb-0.5' : 'text-xs mb-1')}>
        {label}
      </p>
      <p
        className={cn(
          'font-bold text-content-primary metric-tabular tracking-tight leading-none',
          compact ? 'text-lg mb-0' : 'text-2xl mb-1',
        )}
      >
        {value}
      </p>
      {!compact && change !== undefined && changeLabel && (
        <p className="text-[11px] text-content-muted mb-2">{changeLabel}</p>
      )}
      {!compact && change === undefined && subtitle && (
        <p className="text-[11px] text-content-muted mb-2">{subtitle}</p>
      )}

      {chartData.length > 0 && (
        <div className={cn('-mx-0.5 mt-auto opacity-70 group-hover:opacity-100 transition-opacity', compact ? 'h-6 mt-1.5' : 'h-10 -mx-1')}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
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
