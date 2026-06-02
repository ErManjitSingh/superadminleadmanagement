import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import DashboardPanel from './DashboardPanel';

function formatCurrency(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n?.toLocaleString('en-IN')}`;
}

export default function TeamPerformance({ agents }) {
  return (
    <DashboardPanel title="Team Performance" subtitle="This month">
      <div className="space-y-3">
        {agents.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 p-3 rounded-xl border border-subtle bg-surface-elevated/30 hover:bg-surface-elevated transition-colors"
          >
            <span className="text-xs font-bold text-content-muted w-4">{i + 1}</span>
            <Avatar name={agent.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content-primary truncate">{agent.name}</p>
              <p className="text-xs text-content-muted">{agent.converted}/{agent.assigned} converted</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-content-primary metric-tabular">{formatCurrency(agent.revenue)}</p>
              <p className="text-xs text-brand-600 font-medium">{agent.conversionRate}%</p>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardPanel>
  );
}
