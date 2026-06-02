import { Users, Mail, AlertCircle } from 'lucide-react';
import Avatar from '../ui/Avatar';

export default function MyTeamPanel({ team, members, message, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface/80 p-5 text-sm text-content-muted">
        Loading your team…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-indigo-500/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> My Team
          </p>
          <h3 className="text-lg font-bold text-content-primary mt-1">
            {team?.name || 'No team linked'}
          </h3>
          <p className="text-sm text-content-secondary mt-0.5">
            {members.length
              ? `${members.length} sales executive${members.length > 1 ? 's' : ''} — assign leads from actions below`
              : 'Add executives via Sales Manager → Teams'}
          </p>
        </div>
      </div>

      {message && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-800 dark:text-amber-200 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {members.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <div
              key={member._id}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-subtle bg-surface/80"
            >
              <Avatar name={member.name} size="sm" className="!w-7 !h-7" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-content-primary truncate">{member.name}</p>
                {member.email && (
                  <p className="text-[11px] text-content-muted truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {member.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
