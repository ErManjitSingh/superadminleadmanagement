import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import DashboardPanel from './DashboardPanel';

function formatCurrency(n) {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const VISIBLE_ROWS = 5;

export default function ExecutivePerformancePanel({ data, compact = false }) {
  const executives = data?.executives || [];

  return (
    <DashboardPanel
      title="Executive Performance"
      subtitle="Assigned, converted, follow-up completion"
      action={compact && executives.length > VISIBLE_ROWS ? (
        <Link to="/leads/analytics" className="text-xs text-brand-600 hover:underline">View all</Link>
      ) : null}
    >
      {!executives.length ? (
        <p className="text-sm text-content-muted py-6 text-center">No executive data</p>
      ) : (
        <div
          className="space-y-2 overflow-y-auto scrollbar-thin pr-1"
          style={{ maxHeight: `${VISIBLE_ROWS * 4.75}rem` }}
        >
          {executives.map((exec, i) => (
            <motion.div
              key={exec._id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-subtle bg-surface-elevated/30 hover:bg-surface-elevated/60 transition-colors"
            >
              <span className="text-xs font-bold text-content-muted w-5 text-center">{i + 1}</span>
              <Avatar name={exec.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{exec.name}</p>
                <p className="text-xs text-content-muted">
                  {exec.assigned} assigned · {exec.converted} converted · {exec.followUpCompletion}% FU done
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-content-primary">{exec.conversionRate}%</p>
                <p className="text-[10px] text-content-muted">{formatCurrency(exec.revenue)}</p>
              </div>
              {exec.hotLeads > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                  {exec.hotLeads} hot
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}
