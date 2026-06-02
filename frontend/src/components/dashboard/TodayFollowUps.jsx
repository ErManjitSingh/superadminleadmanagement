import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import DashboardPanel from './DashboardPanel';

export default function TodayFollowUps({ followups }) {
  return (
    <DashboardPanel
      title="Today's Follow-ups"
      subtitle="Scheduled for today"
      className="h-full"
      action={
        <Link to="/followups" className="text-xs font-medium text-brand-600 hover:underline inline-flex items-center gap-1">
          Calendar <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      <div className="space-y-2">
        {followups.length === 0 ? (
          <p className="text-sm text-content-muted text-center py-8">All clear for today</p>
        ) : (
          followups.map((f) => (
            <div
              key={f._id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content-primary truncate">{f.customerName}</p>
                <p className="text-xs text-content-muted">
                  {new Date(f.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  {' · '}{f.phone}
                </p>
              </div>
              <StatusBadge status={f.status} />
            </div>
          ))
        )}
      </div>
    </DashboardPanel>
  );
}
