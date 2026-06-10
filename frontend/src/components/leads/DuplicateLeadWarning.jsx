import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { getLeadStatusLabel } from '../../lib/leadStatusLabel';

export default function DuplicateLeadWarning({
  match,
  onOpenExisting,
  onCreateAnyway,
  onMerge,
  canCreateAnyway = false,
  canMerge = false,
}) {
  if (!match) return null;

  const daysAgo = match.daysAgo ?? Math.floor(
    (Date.now() - new Date(match.createdAt).getTime()) / 86400000
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Duplicate phone number</p>
        <p className="text-xs text-amber-700/90 dark:text-amber-300/90 mt-1">
          A lead with this phone already exists — <span className="font-medium">{match.name}</span>
          {match.assignedTo?.name && (
            <> · Assigned to <span className="font-medium">{match.assignedTo.name}</span></>
          )}
          {' · '}Created {daysAgo} day{daysAgo === 1 ? '' : 's'} ago
        </p>
        <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1.5">
          Original lead status: <span className="font-semibold">{getLeadStatusLabel(match.status)}</span>
          {match.statusReason ? (
            <> — <span className="italic">&quot;{match.statusReason}&quot;</span></>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {onOpenExisting ? (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onOpenExisting}>
              Open Existing Lead
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="h-7 text-xs">
              <Link to={`/leads/${match._id}`}>Open Existing Lead</Link>
            </Button>
          )}
          {canMerge && onMerge && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs border-violet-400/50 text-violet-700" onClick={onMerge}>
              Merge into Existing
            </Button>
          )}
          {canCreateAnyway && onCreateAnyway && (
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-amber-800" onClick={onCreateAnyway}>
              Create New Anyway
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
