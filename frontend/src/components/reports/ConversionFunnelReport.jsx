import { motion } from 'framer-motion';
import DashboardPanel from '../dashboard/DashboardPanel';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#f59e0b', '#10b981'];

export default function ConversionFunnelReport({ data }) {
  const max = data[0]?.count || 1;

  return (
    <DashboardPanel title="Conversion Funnel" subtitle="Stage-wise drop-off with percentages">
      <div className="space-y-3">
        {data.map((stage, i) => {
          const widthPct = (stage.count / max) * 100;
          const dropPct = i > 0 ? Math.round((stage.count / data[i - 1].count) * 100) : 100;

          return (
            <div key={stage.stage}>
              {i > 0 && (
                <div className="flex items-center justify-center py-1">
                  <span className="text-[10px] font-bold text-content-muted bg-surface-elevated px-2 py-0.5 rounded-full">↓ {dropPct}% retained</span>
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, scaleX: 0.8 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: i * 0.06 }}
                className="relative mx-auto transition-all"
                style={{ width: `${Math.max(widthPct, 28)}%` }}
              >
                <div
                  className="rounded-xl px-4 py-3 text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[i]}cc)` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{stage.stage}</span>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black metric-tabular">{stage.count}</span>
                      <span className="text-[10px] opacity-80 ml-1">({stage.pct}%)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
