import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { QUOTE_TIMELINE_TYPES } from './constants';

function fmt(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function QuoteTimeline({ timeline = [] }) {
  if (!timeline.length) return null;

  return (
    <div className="rounded-2xl border border-subtle bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-subtle bg-gradient-to-r from-sky-500/10 to-indigo-500/10">
        <h3 className="text-sm font-bold text-content-primary">Client Timeline</h3>
        <p className="text-xs text-content-muted">Quote activity tracking</p>
      </div>
      <div className="p-5 relative">
        <div className="absolute left-[27px] top-6 bottom-6 w-px bg-gradient-to-b from-sky-400/40 to-transparent" />
        <div className="space-y-4">
          {timeline.map((item, i) => {
            const cfg = QUOTE_TIMELINE_TYPES[item.type] || QUOTE_TIMELINE_TYPES.created;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 relative">
                <div className={cn('w-3 h-3 rounded-full mt-1.5 shrink-0', cfg.color)} />
                <div className="flex-1 pb-1">
                  <p className="text-sm font-semibold text-content-primary">{cfg.label}</p>
                  <p className="text-xs text-content-muted">{item.user} · {fmt(item.date)}</p>
                  {item.notes && <p className="text-sm text-content-secondary mt-1">{item.notes}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
