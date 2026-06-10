import { AlertTriangle, CalendarPlus } from 'lucide-react';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useDataRefresh } from '../../hooks/useDataRefresh';

const MISSED_ALERT_ROLES = new Set(['sales_executive', 'sales_manager', 'team_leader']);

export default function MissedFollowUpAlert() {
  const { user } = useAuth();
  const { notifications, refresh, handleNotificationClick } = useNotifications();

  useDataRefresh(['followups'], refresh);

  const unresolved = useMemo(() => {
    const isOversightRole = user?.role === 'sales_manager' || user?.role === 'team_leader';
    return notifications.filter((n) => {
      if (n?.type !== 'followup_missed' || n?.meta?.resolved === true) return false;
      return isOversightRole ? n?.meta?.oversight === true : n?.meta?.oversight !== true;
    });
  }, [notifications, user?.role]);

  if (!MISSED_ALERT_ROLES.has(user?.role) || !unresolved.length) return null;

  const latest = unresolved[0];

  return (
    <div className="mb-4 rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Missed Follow-up Alert
            </p>
            <p className="text-xs text-rose-700/90 dark:text-rose-300/90 mt-0.5">
              {unresolved.length} missed follow-up notification(s). This alert will stay until next follow-up is added.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleNotificationClick(latest)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:underline"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Open Lead
        </button>
      </div>
    </div>
  );
}
