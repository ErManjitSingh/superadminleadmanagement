import { CalendarClock } from 'lucide-react';
import { getUpcomingFollowUp, DETAIL_CARD } from './leadDetailUtils';

export default function LeadUpcomingFollowUp({ followups = [], lead }) {
  const upcoming = getUpcomingFollowUp(followups) || (lead?.nextFollowUp ? { scheduledAt: lead.nextFollowUp, status: 'pending' } : null);

  return (
    <div className={DETAIL_CARD}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Follow-up</h3>
      </div>
      <div className="p-4">
        {upcoming ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 dark:bg-violet-950/20 dark:border-violet-900/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <CalendarClock className="w-4 h-4 shrink-0" />
                <p className="text-sm font-semibold">
                  {new Date(upcoming.scheduledAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-violet-600 text-white shrink-0">
                Upcoming
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-3">No upcoming follow-up</p>
        )}
      </div>
    </div>
  );
}
