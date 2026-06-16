import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import DashboardPanel from './DashboardPanel';
import { cn } from '../../lib/utils';

const PRIORITY_STYLES = {
  high: 'bg-red-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white',
  urgent: 'bg-red-600 text-white',
};

export default function TodayFollowUps({ followups = [] }) {
  return (
    <DashboardPanel
      title="Upcoming Follow-ups"
      subtitle="Scheduled client callbacks"
      className="h-full"
      action={
        <Link to="/followups" className="text-xs font-medium text-blue-600 hover:underline inline-flex items-center gap-1">
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-2">
        {followups.length === 0 ? (
          <p className="text-sm text-content-muted text-center py-8">All clear for today</p>
        ) : (
          followups.map((f) => {
            const time = new Date(f.scheduledAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            const priority = (f.priority || f.status || 'medium').toLowerCase();
            return (
              <div
                key={f._id}
                className="flex items-center gap-3 p-3 rounded-xl border border-subtle hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-content-primary truncate">{f.customerName}</p>
                  <p className="text-xs text-content-muted truncate">
                    {f.destination || f.phone || 'Follow-up'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-red-500 tabular-nums">{time}</p>
                  <span
                    className={cn(
                      'inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md capitalize',
                      PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
                    )}
                  >
                    {priority}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
}
