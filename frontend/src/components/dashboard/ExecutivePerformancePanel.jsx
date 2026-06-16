import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import DashboardPanel from './DashboardPanel';

const VISIBLE_ROWS = 5;

export default function ExecutivePerformancePanel({ data, compact = false }) {
  const executives = data?.executives || [];

  const maxAssigned = Math.max(...executives.map((e) => e.assigned || 0), 1);

  return (
    <DashboardPanel
      title="Top Performing Executives"
      subtitle="Lead assignment & conversion"
      action={compact && executives.length > VISIBLE_ROWS ? (
        <Link to="/leads/analytics" className="text-xs text-blue-600 hover:underline font-medium">View all</Link>
      ) : null}
      className="h-full"
    >
      {!executives.length ? (
        <p className="text-sm text-content-muted py-6 text-center">No executive data</p>
      ) : (
        <div
          className="space-y-4 overflow-y-auto scrollbar-thin pr-1"
          style={{ maxHeight: compact ? `${VISIBLE_ROWS * 4.75}rem` : undefined }}
        >
          {executives.map((exec, i) => (
            <motion.div
              key={exec._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3"
            >
              <Avatar name={exec.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold text-content-primary truncate">{exec.name}</p>
                  <span className="text-xs font-bold text-content-muted tabular-nums shrink-0">
                    {exec.assigned || exec.converted * 3} leads
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                    style={{ width: `${((exec.assigned || exec.converted * 3) / maxAssigned) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
