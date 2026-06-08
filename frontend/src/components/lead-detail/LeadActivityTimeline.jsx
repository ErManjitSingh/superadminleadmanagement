import { motion } from 'framer-motion';
import { ACTIVITY_CONFIG } from './leadDetailData';

function formatActivityDate(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

export default function LeadActivityTimeline({ activities }) {
  const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-subtle bg-surface-elevated/40">
        <h3 className="text-[15px] font-semibold text-content-primary">Activity Timeline</h3>
        <p className="text-xs text-content-muted mt-0.5">HubSpot-style activity feed</p>
      </div>
      <div className="p-5">
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/30 via-subtle to-transparent" />
          <div className="space-y-1">
            {sorted.map((item, i) => {
              const cfg = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.status_changed;
              const Icon = cfg.icon;
              const { date, time } = formatActivityDate(item.date);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex gap-4 py-3 group"
                >
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-content-primary">{item.title || cfg.label}</p>
                        <p className="text-xs text-content-muted mt-0.5">
                          <span className="font-medium text-content-secondary">{item.user}</span>
                          {' · '}{date} at {time}
                        </p>
                      </div>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-content-secondary mt-2 p-3 rounded-xl bg-surface-elevated/60 border border-subtle">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
