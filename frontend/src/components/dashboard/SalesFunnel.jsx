import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';

const STAGES = ['#3B82F6', '#4F46E5', '#6366F1', '#7C3AED', '#8B5CF6', '#059669'];

export default function SalesFunnel({ data }) {
  const max = data[0]?.count || 1;

  return (
    <DashboardPanel title="Sales Pipeline" subtitle="Conversion at each stage">
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 lg:gap-0">
        {data.map((stage, i) => {
          const pct = Math.round((stage.count / max) * 100);
          const dropOff = i > 0 ? Math.round((stage.count / data[i - 1].count) * 100) : 100;

          return (
            <div key={stage.stage} className="flex-1 flex flex-col lg:flex-row lg:items-center min-w-0">
              {i > 0 && (
                <div className="hidden lg:flex flex-col items-center justify-center px-1 shrink-0">
                  <div className="w-px h-6 bg-surface-elevated" />
                  <span className="text-[9px] font-bold text-content-muted my-0.5">{dropOff}%</span>
                  <div className="w-px h-6 bg-surface-elevated" />
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex-1 rounded-xl border border-subtle bg-surface-elevated/50 p-4 hover:border-brand-500/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-content-secondary truncate">{stage.stage}</span>
                  <span className="text-lg font-bold text-content-primary metric-tabular shrink-0 ml-2">
                    {stage.count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.08 }}
                    className="h-full rounded-full"
                    style={{ background: STAGES[i] }}
                  />
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
