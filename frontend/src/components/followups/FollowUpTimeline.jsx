import { motion } from 'framer-motion';
import { Clock, User } from 'lucide-react';
import FollowUpStatusBadge from './FollowUpStatusBadge';
import { formatFollowUpDate, formatFollowUpTime } from './followupUtils';

export default function FollowUpTimeline({ entries }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-12 text-center text-content-muted">
        No follow-up history yet
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/5 to-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-violet-400/20 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-500/25">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-violet-800 dark:text-violet-200">Follow-up Timeline</h3>
          <p className="text-xs text-violet-600/70 dark:text-violet-300/70">Complete history across all leads</p>
        </div>
      </div>
      <div className="p-5">
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/30 via-subtle to-transparent" />
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative flex gap-4 py-3"
              >
                <div className="relative z-10 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pb-2 border-b border-subtle last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-content-primary">{entry.customerName}</p>
                      <p className="text-xs text-content-muted">{entry.destination}</p>
                    </div>
                    <FollowUpStatusBadge status={entry.status} />
                  </div>
                  <p className="text-sm text-content-secondary mt-1">{entry.remarks}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content-muted">
                    <span>{formatFollowUpDate(entry.date)} · {formatFollowUpTime(entry.date)}</span>
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3" /> {entry.executive}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
