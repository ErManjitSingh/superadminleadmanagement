import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { formatFollowUpDateTime } from './followupUtils';

export default function MissedFollowUpsPanel({ missed, onSelect }) {
  return (
    <div className="rounded-2xl border border-red-400/30 bg-gradient-to-br from-red-500/10 via-rose-500/5 to-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-red-400/20 bg-gradient-to-r from-red-500/20 to-rose-500/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-red-800 dark:text-red-200">Missed Follow-ups</h3>
          <p className="text-xs text-red-600/80 dark:text-red-300/80">{missed.length} overdue task{missed.length !== 1 ? 's' : ''} — action needed</p>
        </div>
      </div>
      <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin">
        {missed.length === 0 ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center py-6 font-medium">No missed follow-ups 🎉</p>
        ) : (
          missed.map((f, i) => (
            <motion.button
              key={f._id}
              type="button"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect?.(f)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-400/25 bg-gradient-to-r from-red-500/8 to-rose-500/5 hover:from-red-500/15 hover:to-rose-500/10 hover:border-red-400/40 transition-all text-left hover:shadow-md"
            >
              <Avatar name={f.lead?.name} size="sm" className="!w-9 !h-9 !text-xs shrink-0 ring-2 ring-red-400/30" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{f.lead?.name}</p>
                <p className="text-xs text-content-muted truncate">{f.lead?.destination} · {f.assignedTo?.name}</p>
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {f.daysOverdue} day{f.daysOverdue !== 1 ? 's' : ''} overdue
                </p>
              </div>
              <span className="text-[10px] font-medium text-red-600/70 dark:text-red-400/70 shrink-0 bg-red-500/10 px-2 py-1 rounded-lg">
                {formatFollowUpDateTime(f.scheduledAt)}
              </span>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
