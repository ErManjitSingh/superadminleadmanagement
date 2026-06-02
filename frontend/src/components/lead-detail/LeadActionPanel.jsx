import { Link } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Mail,
  StickyNote,
  CalendarPlus,
  UserCheck,
  RefreshCw,
  FileText,
  Pencil,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const actions = [
  {
    icon: Phone,
    label: 'Call Customer',
    link: 'tel',
    className: 'bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-md shadow-emerald-600/20 h-11',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp Customer',
    link: 'whatsapp',
    className: 'text-green-700 border-green-500/40 bg-green-500/10 hover:bg-green-500/20 dark:text-green-400',
  },
  {
    icon: Mail,
    label: 'Send Email',
    link: 'email',
    className: 'text-sky-700 border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 dark:text-sky-400',
  },
  {
    icon: StickyNote,
    label: 'Add Note',
    action: 'note',
    className: 'text-amber-700 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 dark:text-amber-400',
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
  {
    icon: FileText,
    label: 'Create Quotation',
    action: 'quote',
    className: 'text-rose-700 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 dark:text-rose-400 font-medium',
  },
];

function ActionButton({ action, lead, onAddFollowUp, onAddNote, onAssign, onCreateQuote, onChangeStatus }) {
  const Icon = action.icon;
  const baseClass = cn(
    'w-full rounded-xl justify-start gap-3 h-10 border',
    action.className
  );

  if (action.link === 'tel') {
    return (
      <a href={lead?.phone ? `tel:${lead.phone}` : '#'} className="block">
        <Button className={baseClass}>
          <Icon className="w-4 h-4" /> {action.label}
        </Button>
      </a>
    );
  }

  if (action.link === 'whatsapp') {
    const wa = lead?.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}` : '#';
    return (
      <a href={wa} target="_blank" rel="noreferrer" className="block">
        <Button variant="outline" className={baseClass}>
          <Icon className="w-4 h-4" /> {action.label}
        </Button>
      </a>
    );
  }

  if (action.link === 'email') {
    return (
      <a href={lead?.email ? `mailto:${lead.email}` : '#'} className="block">
        <Button variant="outline" className={baseClass}>
          <Icon className="w-4 h-4" /> {action.label}
        </Button>
      </a>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => {
        if (action.action === 'followup') onAddFollowUp?.();
        if (action.action === 'note') onAddNote?.();
        if (action.action === 'assign') onAssign?.();
        if (action.action === 'status') onChangeStatus?.();
        if (action.action === 'quote') onCreateQuote?.();
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
  onAddNote,
  onAssign,
  onCreateQuote,
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
            if (action.action === 'quote' && !onCreateQuote) return null;
            if (action.action === 'followup' && (!onAddFollowUp || !canCreateFollowUp)) return null;
            if (action.action === 'status' && (!onChangeStatus || !canChangeStatus)) return null;
            return (
              <ActionButton
                key={action.label}
                action={action}
                lead={lead}
                onAddFollowUp={onAddFollowUp}
                onAddNote={onAddNote}
                onAssign={onAssign}
                onCreateQuote={onCreateQuote}
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
