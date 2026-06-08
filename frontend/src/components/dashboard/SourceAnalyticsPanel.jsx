import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';

const SOURCE_COLORS = [
  'bg-brand-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-teal-500',
];

export default function SourceAnalyticsPanel({ data }) {
  const sources = data?.sources || [];
  if (!sources.length) {
    return (
      <DashboardPanel title="Source Analytics" subtitle="Conversion by lead source">
        <p className="text-sm text-content-muted py-6 text-center">No source data yet</p>
      </DashboardPanel>
    );
  }

  const maxTotal = Math.max(...sources.map((s) => s.total), 1);

  return (
    <DashboardPanel title="Source Analytics" subtitle="Leads, conversion rate & pipeline by source">
      <div className="space-y-4">
        {sources.slice(0, 8).map((src, i) => (
          <motion.div
            key={src.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group"
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{src.label}</p>
                <p className="text-xs text-content-muted">
                  {src.total} leads · {src.sharePct}% share
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-emerald-600">{src.conversionRate}%</p>
                <p className="text-[10px] text-content-muted">{src.converted} converted</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className={`h-full rounded-full ${SOURCE_COLORS[i % SOURCE_COLORS.length]} transition-all`}
                style={{ width: `${(src.total / maxTotal) * 100}%` }}
              />
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-content-muted">
              <span>{src.pipeline} in pipeline</span>
              <span>{src.lost} lost</span>
              <span>Avg score {src.avgScore}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardPanel>
  );
}
