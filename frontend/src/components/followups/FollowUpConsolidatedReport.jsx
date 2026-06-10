import { BarChart3, Users } from 'lucide-react';

export default function FollowUpConsolidatedReport({ teamReport = [] }) {
  const totals = teamReport.reduce(
    (acc, row) => ({
      today: acc.today + (row.today || 0),
      missed: acc.missed + (row.missed || 0),
      completed: acc.completed + (row.completed || 0),
      warm: acc.warm + (row.warm || 0),
      converted: acc.converted + (row.converted || 0),
    }),
    { today: 0, missed: 0, completed: 0, warm: 0, converted: 0 }
  );

  return (
    <div className="rounded-2xl border border-indigo-400/25 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-indigo-400/20 bg-gradient-to-r from-indigo-500/15 to-violet-500/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Team Follow-up Report</h3>
          <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">Consolidated view by executive</p>
        </div>
      </div>

      <div className="px-5 py-3 grid grid-cols-3 gap-2 border-b border-subtle bg-surface-elevated/30">
        {[
          { label: 'Today', value: totals.today },
          { label: 'Missed', value: totals.missed, warn: totals.missed > 0 },
          { label: 'Done', value: totals.completed },
        ].map(({ label, value, warn }) => (
          <div key={label} className="text-center p-2 rounded-lg bg-surface/60">
            <p className={`text-lg font-bold ${warn ? 'text-rose-600' : 'text-content-primary'}`}>{value}</p>
            <p className="text-[10px] text-content-muted uppercase">{label}</p>
          </div>
        ))}
      </div>

      <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin">
        {teamReport.length === 0 ? (
          <p className="text-sm text-content-muted text-center py-6">No follow-up data yet</p>
        ) : (
          teamReport.map((row) => (
            <div
              key={row.executiveId || 'unassigned'}
              className="flex items-center gap-3 p-3 rounded-xl border border-subtle bg-surface-elevated/40"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{row.executiveName}</p>
                <p className="text-[10px] text-content-muted mt-0.5">
                  Today {row.today || 0} · Missed {row.missed || 0} · Warm {row.warm || 0} · Converted {row.converted || 0}
                </p>
              </div>
              {(row.missed || 0) > 0 && (
                <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-1 rounded-lg shrink-0">
                  {row.missed} missed
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
