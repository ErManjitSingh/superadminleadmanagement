import { Building2, Home } from 'lucide-react';

function formatTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function ModeBadge({ mode }) {
  const isWfh = mode === 'wfh';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
        isWfh
          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
          : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
      }`}
    >
      {isWfh ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
      {isWfh ? 'WFH' : 'Office'}
    </span>
  );
}

export default function AttendanceTeamList({ records = [], title = 'Team Attendance Today', emptyMessage }) {
  if (!records.length) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface/80 p-6 text-center text-sm text-content-muted">
        {emptyMessage || 'No check-ins yet today'}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
      <div className="px-5 py-3 border-b border-subtle">
        <h3 className="font-semibold text-content-primary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-content-muted border-b border-subtle">
              <th className="px-5 py-2.5 font-medium">Name</th>
              <th className="px-5 py-2.5 font-medium">Mode</th>
              <th className="px-5 py-2.5 font-medium">Check In</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-subtle/60 last:border-0 hover:bg-surface-elevated/50">
                <td className="px-5 py-3 font-medium text-content-primary">{r.userName}</td>
                <td className="px-5 py-3">
                  <ModeBadge mode={r.workMode} />
                </td>
                <td className="px-5 py-3 text-content-secondary tabular-nums">{formatTime(r.checkIn)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-semibold capitalize ${
                      r.status === 'late'
                        ? 'text-amber-600 dark:text-amber-400'
                        : r.isOnline
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-content-muted'
                    }`}
                  >
                    {r.isOnline ? 'Online' : r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
