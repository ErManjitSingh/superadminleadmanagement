import DashboardPanel from './DashboardPanel';

const BUCKET_COLORS = {
  '0_7': 'bg-emerald-500',
  '8_15': 'bg-brand-500',
  '16_30': 'bg-amber-500',
  '30_plus': 'bg-rose-500',
};

export default function AgingChartPanel({ aging = [] }) {
  const max = Math.max(...aging.map((b) => b.count), 1);

  return (
    <DashboardPanel title="Lead Aging" subtitle="How long leads have been in the pipeline">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {aging.map((bucket) => (
          <div
            key={bucket.key}
            className="rounded-xl border border-subtle bg-surface-elevated/40 p-4 text-center"
          >
            <div className="h-16 flex items-end justify-center mb-2">
              <div
                className={`w-10 rounded-t-lg ${BUCKET_COLORS[bucket.key] || 'bg-slate-400'} transition-all`}
                style={{ height: `${Math.max(12, (bucket.count / max) * 100)}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-content-primary metric-tabular">{bucket.count}</p>
            <p className="text-xs text-content-muted mt-1">{bucket.label}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
