import { MapPin, User, Sparkles, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getLeadSourceShortLabel } from '../../lib/leadSourceLabels';
import Avatar from '../ui/Avatar';
import { STATUS_STYLES, formatBudget } from './managerUtils';

const SOURCE_STYLES = {
  website: 'bg-gradient-to-r from-sky-500/20 to-blue-500/15 text-sky-700 dark:text-sky-300 ring-sky-400/40',
  google_ads: 'bg-gradient-to-r from-sky-500/20 to-blue-500/15 text-sky-700 dark:text-sky-300 ring-sky-400/40',
  referral: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-400/40',
  social: 'bg-gradient-to-r from-violet-500/20 to-purple-500/15 text-violet-700 dark:text-violet-300 ring-violet-400/40',
  facebook_ads: 'bg-gradient-to-r from-indigo-500/20 to-blue-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-400/40',
  'fb-lead': 'bg-gradient-to-r from-indigo-500/20 to-blue-500/15 text-indigo-700 dark:text-indigo-300 ring-indigo-400/40',
  phone: 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-700 dark:text-amber-300 ring-amber-400/40',
  'walk-in': 'bg-gradient-to-r from-rose-500/20 to-pink-500/15 text-rose-700 dark:text-rose-300 ring-rose-400/40',
  whatsapp: 'bg-gradient-to-r from-green-500/20 to-emerald-500/15 text-green-700 dark:text-green-300 ring-green-400/40',
  wa: 'bg-gradient-to-r from-green-500/20 to-emerald-500/15 text-green-700 dark:text-green-300 ring-green-400/40',
  organic: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/15 text-teal-700 dark:text-teal-300 ring-teal-400/40',
  other: 'bg-gradient-to-r from-slate-500/15 to-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-400/30',
};

const DEST_COLORS = [
  'from-sky-500/15 to-cyan-500/10 text-sky-700 ring-sky-400/30',
  'from-violet-500/15 to-purple-500/10 text-violet-700 ring-violet-400/30',
  'from-amber-500/15 to-orange-500/10 text-amber-700 ring-amber-400/30',
  'from-emerald-500/15 to-teal-500/10 text-emerald-700 ring-emerald-400/30',
  'from-rose-500/15 to-pink-500/10 text-rose-700 ring-rose-400/30',
];

function destStyle(name = '') {
  const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % DEST_COLORS.length;
  return DEST_COLORS[i];
}

export function LeadIdPill({ id }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand-500/15 to-indigo-500/15 text-brand-700 dark:text-brand-300 ring-1 ring-brand-400/30">
      <Sparkles className="w-3 h-3 text-brand-500" />
      {id}
    </span>
  );
}

export function SourceBadge({ source, label, sourceShort }) {
  const display = sourceShort || label || getLeadSourceShortLabel(source, label);
  const styleKey = (source || display || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const style =
    SOURCE_STYLES[styleKey] ||
    (display === 'FB Lead' ? SOURCE_STYLES['fb-lead'] : null) ||
    (display === 'WA' ? SOURCE_STYLES.wa : null) ||
    SOURCE_STYLES.website;
  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset whitespace-nowrap', style)}>
      {display}
    </span>
  );
}

export function DestinationChip({ name }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-normal ring-1 ring-inset bg-gradient-to-r max-w-[120px] truncate', destStyle(name))}>
      <MapPin className="w-3 h-3 shrink-0 opacity-70" />
      {name}
    </span>
  );
}

export function TravelersBadge({ travelers, adults, children }) {
  const count = travelers ?? adults ?? null;
  if (count == null || count === '') {
    return <span className="text-xs text-content-muted">—</span>;
  }
  const detail = children > 0 ? `${count} (${children} child${children > 1 ? 'ren' : ''})` : String(count);
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-400/25 whitespace-nowrap">
      <Users className="w-3 h-3 shrink-0" />
      {detail}
    </span>
  );
}

export function BudgetBadge({ amount }) {
  const tier =
    amount >= 300000 ? 'bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-orange-500/20 text-rose-700 ring-amber-400/40' :
    amount >= 150000 ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/15 text-violet-700 ring-violet-400/40' :
    amount >= 75000 ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 text-emerald-700 ring-emerald-400/40' :
    'bg-gradient-to-r from-sky-500/15 to-blue-500/10 text-sky-700 ring-sky-400/30';

  return (
    <span className={cn('inline-flex px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ring-1 ring-inset whitespace-nowrap', tier)}>
      {formatBudget(amount)}
    </span>
  );
}

export function ExecutiveBadge({ name, unassigned }) {
  if (unassigned || !name) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-700 ring-1 ring-amber-400/40">
        <User className="w-3 h-3" /> Unassigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 max-w-[130px]">
      <Avatar name={name} size="sm" className="!w-6 !h-6 !text-[9px] ring-1 ring-violet-500/20 shrink-0" />
      <span className="text-[11px] font-normal text-content-primary truncate">{name}</span>
    </span>
  );
}

export function ManagerStatusBadge({ status, lead }) {
  const isActiveReactivated =
    lead?.reactivation?.isReactivated &&
    ['follow_up', 'working_progress', 'contacted', 'negotiation', 'quotation_sent'].includes(status);
  const label = isActiveReactivated ? 'active' : (status?.replace(/_/g, ' ') || 'new');
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset capitalize whitespace-nowrap',
      STATUS_STYLES[status] || STATUS_STYLES.new
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', status === 'new' && 'animate-pulse', {
        'bg-sky-500': status === 'new',
        'bg-violet-500': status === 'contacted',
        'bg-amber-500': status === 'follow_up',
        'bg-indigo-500': status === 'quotation_sent',
        'bg-orange-500': status === 'negotiation',
        'bg-emerald-500': status === 'converted',
        'bg-rose-500': status === 'lost',
        'bg-teal-500': isActiveReactivated,
      }[isActiveReactivated ? 'active' : status] || 'bg-sky-500')} />
      {label}
    </span>
  );
}

export function CustomerCell({ name }) {
  return (
    <div className="flex items-center gap-2 min-w-0 max-w-[150px]">
      <Avatar name={name} size="sm" className="!w-7 !h-7 !text-[10px] ring-1 ring-violet-500/25 shrink-0" />
      <p className="font-semibold text-[13px] text-content-primary truncate">{name}</p>
    </div>
  );
}

export const assignLeadBtnClass =
  'h-6 text-[10px] px-1.5 py-0 leading-none shadow-sm shadow-violet-600/20 whitespace-nowrap rounded-md';

export const moreLeadBtnClass =
  'h-6 px-1.5 py-0 text-[10px] leading-none font-medium text-content-secondary hover:text-violet-600 hover:bg-violet-500/10 rounded-md border border-subtle';

export const FILTER_THEMES = {
  all: {
    gradient: 'from-brand-500/25 via-violet-500/15 to-indigo-500/20',
    border: 'border-brand-500/25',
    header: 'from-brand-600/10 via-violet-600/8 to-indigo-600/10',
    icon: 'text-brand-600',
  },
  unassigned: {
    gradient: 'from-amber-500/25 via-orange-500/15 to-yellow-500/20',
    border: 'border-amber-500/30',
    header: 'from-amber-500/12 via-orange-500/8 to-yellow-500/10',
    icon: 'text-amber-600',
  },
  assigned: {
    gradient: 'from-emerald-500/20 via-teal-500/15 to-cyan-500/15',
    border: 'border-emerald-500/25',
    header: 'from-emerald-500/10 via-teal-500/8 to-cyan-500/10',
    icon: 'text-emerald-600',
  },
  hot: {
    gradient: 'from-rose-500/25 via-orange-500/20 to-amber-500/15',
    border: 'border-rose-500/30',
    header: 'from-rose-500/12 via-orange-500/10 to-amber-500/8',
    icon: 'text-rose-600',
  },
  lost: {
    gradient: 'from-slate-500/15 via-zinc-500/10 to-neutral-500/10',
    border: 'border-slate-500/25',
    header: 'from-slate-500/10 to-zinc-500/8',
    icon: 'text-slate-500',
  },
  reactivated: {
    gradient: 'from-teal-500/25 via-cyan-500/15 to-emerald-500/15',
    border: 'border-teal-500/30',
    header: 'from-teal-500/12 via-cyan-500/8 to-emerald-500/10',
    icon: 'text-teal-600',
  },
};
