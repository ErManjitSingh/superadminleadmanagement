import { motion } from 'framer-motion';
import { Bell, AlertTriangle, CalendarClock, Zap } from 'lucide-react';

const typeConfig = {
  missed: {
    icon: AlertTriangle,
    card: 'border-red-400/35 bg-gradient-to-r from-red-500/15 to-rose-500/10 hover:from-red-500/25 hover:to-rose-500/15',
    iconWrap: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-md shadow-red-500/25',
    title: 'text-red-700 dark:text-red-300',
  },
  upcoming: {
    icon: CalendarClock,
    card: 'border-amber-400/35 bg-gradient-to-r from-amber-500/15 to-orange-500/10 hover:from-amber-500/25 hover:to-orange-500/15',
    iconWrap: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25',
    title: 'text-amber-700 dark:text-amber-300',
  },
  priority: {
    icon: Zap,
    card: 'border-violet-400/35 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 hover:from-violet-500/25 hover:to-fuchsia-500/15',
    iconWrap: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md shadow-violet-500/25',
    title: 'text-violet-700 dark:text-violet-300',
  },
};

export default function FollowUpNotifications({ notifications, onSelect }) {
  return (
    <div className="rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-indigo-400/20 bg-gradient-to-r from-indigo-500/15 to-violet-500/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Reminders & Alerts</h3>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">{notifications.length} active notification{notifications.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <p className="text-sm text-content-muted text-center py-6">All caught up!</p>
        ) : (
          notifications.map((n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.upcoming;
            const Icon = cfg.icon;
            return (
              <motion.button
                key={n.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelect?.(n.followup)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md ${cfg.card}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconWrap}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${cfg.title}`}>{n.title}</p>
                  <p className="text-xs text-content-secondary mt-0.5 truncate">{n.message}</p>
                  <p className="text-[10px] text-content-muted mt-1">{n.time}</p>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
