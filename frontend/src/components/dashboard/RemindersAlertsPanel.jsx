import { AlertTriangle, Clock, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPanel from './DashboardPanel';
import { cn } from '../../lib/utils';

export default function RemindersAlertsPanel({ stats }) {
  const alerts = [
    {
      label: 'Overdue follow-ups need attention',
      count: stats?.overdueFollowups || 0,
      icon: AlertTriangle,
      tone: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600',
      link: '/followups',
      show: (stats?.overdueFollowups || 0) > 0,
    },
    {
      label: 'Pending follow-ups today',
      count: stats?.pendingFollowups || 0,
      icon: Clock,
      tone: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600',
      link: '/followups',
      show: (stats?.pendingFollowups || 0) > 0,
    },
    {
      label: 'Hot leads require immediate action',
      count: stats?.qualificationWidgets?.hotLeads || 0,
      icon: Flame,
      tone: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600',
      link: '/leads',
      show: (stats?.qualificationWidgets?.hotLeads || 0) > 0,
    },
  ].filter((a) => a.show);

  return (
    <DashboardPanel title="Reminders & Alerts" subtitle="Items needing your attention" className="h-full">
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-content-muted text-center py-8">No urgent alerts</p>
        ) : (
          alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <Link
                key={alert.label}
                to={alert.link}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-colors hover:opacity-90',
                  alert.tone
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.label}</p>
                </div>
                <span className="text-sm font-bold tabular-nums shrink-0">{alert.count}</span>
              </Link>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
}
