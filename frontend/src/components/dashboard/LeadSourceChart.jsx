import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';

const COLORS = ['#2563EB', '#1877F2', '#10B981', '#25D366', '#8B5CF6'];

export default function LeadSourceChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <DashboardPanel title="Lead Sources" subtitle="Acquisition channels" className="h-full">
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-sm text-content-secondary">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-content-primary metric-tabular">{item.value}</span>
                <span className="text-xs text-content-muted ml-1.5">{item.pct}%</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.pct}%` }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.07 }}
                className="h-full rounded-full"
                style={{ background: COLORS[i] }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-subtle flex justify-between text-sm">
        <span className="text-content-muted">Total from all sources</span>
        <span className="font-bold text-content-primary metric-tabular">{total}</span>
      </div>
    </DashboardPanel>
  );
}
