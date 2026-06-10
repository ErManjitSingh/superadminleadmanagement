import { Link } from 'react-router-dom';
import {
  Phone,
  CalendarPlus,
  UserCheck,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const actions = [
  {
    icon: Phone,
    label: 'Log Call Note',
    action: 'callnote',
    className: 'text-emerald-700 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    icon: CalendarPlus,
    label: 'Add Follow Up',
    action: 'followup',
    className: 'text-violet-700 border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 dark:text-violet-400',
  },
  {
    icon: UserCheck,
    label: 'Assign Lead',
    action: 'assign',
    className: 'text-indigo-700 border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 dark:text-indigo-400',
  },
  {
    icon: RefreshCw,
    label: 'Change Status',
    action: 'status',
    className: 'text-orange-700 border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 dark:text-orange-400',
  },
];

function ActionButton({ action, lead, onAddFollowUp, onLogCallNote, onAssign, onChangeStatus }) {
  const Icon = action.icon;
  const baseClass = cn(
    'w-full rounded-xl justify-start gap-3 h-10 border',
    action.className
  );

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (action.action === 'followup') onAddFollowUp?.();
        if (action.action === 'callnote') onLogCallNote?.();
        if (action.action === 'assign') onAssign?.();
        if (action.action === 'status') onChangeStatus?.();
      }}
      className={baseClass}
    >
      <Icon className="w-4 h-4" /> {action.label}
    </Button>
  );
}

export default function LeadActionPanel({
  lead,
  leadId,
  onAddFollowUp,
  onLogCallNote,
  onAssign,
  onChangeStatus,
  canCreateFollowUp = true,
  canEditLead = true,
  canChangeStatus = true,
  editHref,
}) {
  return (
    <div className="space-y-4 xl:sticky xl:top-20">
      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-sm p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-content-muted mb-4">Quick Actions</h3>
        <div className="space-y-2">
          {actions.map((action) => {
            if (action.action === 'assign' && !onAssign) return null;
            if (action.action === 'followup' && (!onAddFollowUp || !canCreateFollowUp)) return null;
            if (action.action === 'status' && (!onChangeStatus || !canChangeStatus)) return null;
            return (
              <ActionButton
                key={action.label}
                action={action}
                lead={lead}
                onAddFollowUp={onAddFollowUp}
                onLogCallNote={onLogCallNote}
                onAssign={onAssign}
                onChangeStatus={onChangeStatus}
              />
            );
          })}
        </div>
      </div>

      {canEditLead && editHref && (
        <Link to={editHref}>
          <Button
            variant="outline"
            className="w-full rounded-xl gap-2 h-10 text-brand-700 border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 dark:text-brand-400"
          >
            <Pencil className="w-4 h-4" /> Edit Lead
          </Button>
        </Link>
      )}
    </div>
  );
}
