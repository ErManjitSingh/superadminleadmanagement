import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../../../lib/utils';

const DEFAULT_COLORS = ['#3B82F6', '#14B8A6', '#8B5CF6', '#F97316', '#22C55E', '#EC4899', '#94A3B8'];

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-subtle bg-surface px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-content-primary">{item.name}</p>
      <p className="text-content-muted">
        {item.value} ({item.payload.pct}%)
      </p>
    </div>
  );
}

export default function OperationsDonutChart({
  data = [],
  totalLabel = 'Total',
  className,
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item) => ({
    ...item,
    pct: total ? Math.round((item.value / total) * 1000) / 10 : 0,
  }));

  if (!chartData.length || !total) {
    return (
      <p className={cn('text-sm text-content-muted py-12 text-center', className)}>
        No data yet
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-5', className)}>
      <div className="relative w-[170px] h-[170px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={76}
              paddingAngle={3}
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-bold text-content-primary tabular-nums">{total}</p>
          <p className="text-[10px] font-medium text-content-muted">{totalLabel}</p>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {chartData.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: item.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }}
            />
            <span className="text-sm text-content-secondary flex-1 min-w-0 truncate">{item.name}</span>
            <span className="text-sm font-semibold text-content-primary tabular-nums">{item.value}</span>
            <span className="text-xs text-content-muted tabular-nums w-10 text-right">{item.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
