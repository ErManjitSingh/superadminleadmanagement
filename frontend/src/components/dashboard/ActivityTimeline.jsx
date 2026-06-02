import { motion } from 'framer-motion';
import { UserPlus, UserCheck, CalendarPlus, RefreshCw, Trophy } from 'lucide-react';
import DashboardPanel from './DashboardPanel';

const config = {
  lead_created: { icon: UserPlus, color: 'text-blue-600' },
  lead_assigned: { icon: UserCheck, color: 'text-violet-600' },
  followup_added: { icon: CalendarPlus, color: 'text-amber-600' },
  status_updated: { icon: RefreshCw, color: 'text-indigo-600' },
  lead_converted: { icon: Trophy, color: 'text-emerald-600' },
};

export default function ActivityTimeline({ activities }) {
  return (
    <DashboardPanel title="Recent Activity" subtitle="Live feed">
      <div className="space-y-0">
        {activities.map((item, i) => {
          const c = config[item.type] || config.status_updated;
          const Icon = c.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-3 py-3 border-b border-subtle last:border-0"
            >
              <div className={`mt-0.5 ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-content-primary">
                  <span className="font-medium">{item.user}</span>{' '}
                  <span className="text-content-secondary">{item.text}</span>
                </p>
                <p className="text-xs text-content-muted mt-0.5">{item.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
