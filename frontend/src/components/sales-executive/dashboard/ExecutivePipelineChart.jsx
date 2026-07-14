import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function ExecutivePipelineChart({
  data = [],
  total = 0,
  centerLabel = 'Total Leads',
  centerSuffix = '',
  compact = false,
}) {
  if (!data.length) {
    return <p className="text-sm text-content-muted py-12 text-center">No pipeline data yet</p>;
  }

  const size = compact ? 160 : 200;
  const inner = compact ? 48 : 62;
  const outer = compact ? 68 : 88;

  const chart = (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [value, name]}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--color-border-subtle)',
              background: 'var(--color-surface)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
        <p className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-content-primary tabular-nums`}>
          {typeof total === 'number' ? total.toLocaleString('en-IN') : total}
          {centerSuffix}
        </p>
        <p className={`${compact ? 'text-[9px]' : 'text-[11px]'} font-medium text-content-muted leading-tight`}>
          {centerLabel}
        </p>
      </div>
    </div>
  );

  if (compact) {
    return <div className="flex justify-center">{chart}</div>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {chart}
      <div className="flex-1 w-full space-y-2.5">
        {data.map((item) => {
          const sum = data.reduce((s, d) => s + d.value, 0);
          const pct = sum ? Math.round((item.value / sum) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-sm text-content-secondary flex-1 min-w-0 truncate">{item.name}</span>
              <span className="text-sm font-semibold text-content-primary tabular-nums">{pct}%</span>
              <span className="text-xs text-content-muted tabular-nums w-8 text-right">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
