import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  Pencil,
  UserPlus,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LeadStatusBadge from './LeadStatusBadge';
import LeadTemperatureBadge from './LeadTemperatureBadge';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/button';
import AppDrawer from '../ui/AppDrawer';
import { formatLeadId } from './constants';
import { cn } from '../../lib/utils';

function assigneeLabel(lead) {
  if (lead?.assigneeRole === 'sales_manager') return 'Sales Manager';
  if (lead?.assigneeRole === 'team_leader') return 'Team Leader';
  if (lead?.assignedManager?.name && lead.assignedTo?.name === lead.assignedManager.name) return 'Sales Manager';
  if (lead?.assignedTeamLeader?.name && lead.assignedTo?.name === lead.assignedTeamLeader.name) return 'Team Leader';
  return 'Travel Consultant';
}

function InfoCard({ icon: Icon, label, value, accent = 'brand' }) {
  const accents = {
    brand: 'from-brand-500/10 to-violet-500/5 border-brand-500/15 text-brand-600',
    sky: 'from-sky-500/10 to-blue-500/5 border-sky-500/15 text-sky-600',
    amber: 'from-amber-500/10 to-orange-500/5 border-amber-500/15 text-amber-600',
    emerald: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/15 text-emerald-600',
  };

  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br p-3.5', accents[accent])}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/70 dark:bg-slate-900/50 ring-1 ring-black/5">
          <Icon className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-content-primary break-words">{value || '—'}</p>
        </div>
      </div>
    </div>
  );
}

function QuickContactButton({ href, icon: Icon, label, tone }) {
  const tones = {
    phone: 'from-sky-500/15 to-blue-500/10 text-sky-700 ring-sky-500/25 hover:from-sky-500/25',
    mail: 'from-violet-500/15 to-purple-500/10 text-violet-700 ring-violet-500/25 hover:from-violet-500/25',
    whatsapp: 'from-emerald-500/15 to-green-500/10 text-emerald-700 ring-emerald-500/25 hover:from-emerald-500/25',
  };

  return (
    <a
      href={href}
      target={label === 'WhatsApp' ? '_blank' : undefined}
      rel={label === 'WhatsApp' ? 'noreferrer' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-all ring-1 ring-inset',
        'bg-gradient-to-br active:scale-[0.98]',
        tones[tone]
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[11px] font-semibold">{label}</span>
    </a>
  );
}

export default function LeadPreviewDrawer({ lead, onClose, onAssign, canEditLead = true }) {
  const waHref = lead?.phone ? `https://wa.me/${lead.phone.replace(/\D/g, '')}` : null;

  return (
    <AppDrawer open={!!lead} onClose={onClose} className="max-w-[420px] border-l border-violet-500/15">
      {lead && (
        <>
          <div className="relative shrink-0 overflow-hidden border-b border-violet-500/15">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-brand-600/15" />
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
            <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-brand-500/15 blur-2xl" />

            <div className="relative p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative">
                    <Avatar name={lead.name} size="lg" className="ring-4 ring-white/80 dark:ring-slate-900/80 shadow-lg" />
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-brand-600 text-white shadow-md">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                      {formatLeadId(lead._id)}
                    </p>
                    <h2 className="truncate text-xl font-bold text-content-primary">{lead.name}</h2>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <LeadStatusBadge status={lead.status} pulse={lead.status === 'new'} size="sm" />
                      <LeadTemperatureBadge temperature={lead.temperature} />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/40 bg-white/50 p-2 text-content-muted shadow-sm backdrop-blur-sm transition-colors hover:bg-white/80 hover:text-content-primary dark:border-slate-700/50 dark:bg-slate-900/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(lead.phone || lead.email || waHref) && (
                <div className="mt-4 flex gap-2">
                  {lead.phone && (
                    <QuickContactButton href={`tel:${lead.phone}`} icon={Phone} label="Call" tone="phone" />
                  )}
                  {waHref && (
                    <QuickContactButton href={waHref} icon={MessageCircle} label="WhatsApp" tone="whatsapp" />
                  )}
                  {lead.email && (
                    <QuickContactButton href={`mailto:${lead.email}`} icon={Mail} label="Email" tone="mail" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <section>
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-content-muted">
                Travel Overview
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoCard icon={MapPin} label="Destination" value={lead.destination} accent="sky" />
                <InfoCard
                  icon={Calendar}
                  label="Travel Date"
                  value={
                    lead.travelDate
                      ? new Date(lead.travelDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : null
                  }
                  accent="amber"
                />
                <InfoCard
                  icon={IndianRupee}
                  label="Budget"
                  value={lead.budget ? `₹${lead.budget.toLocaleString('en-IN')}` : null}
                  accent="emerald"
                />
                <InfoCard icon={Users} label="Travelers" value={lead.travelers} accent="brand" />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-content-muted">Assigned To</h3>
                {onAssign && (
                  <button
                    type="button"
                    onClick={() => onAssign(lead)}
                    className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-600 ring-1 ring-violet-500/20 transition-colors hover:bg-violet-500/15"
                  >
                    <UserPlus className="w-3 h-3" />
                    {lead.assignedTo?.name ? 'Reassign' : 'Assign'}
                  </button>
                )}
              </div>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4',
                  lead.assignedTo?.name
                    ? 'border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent'
                    : 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent'
                )}
              >
                <Avatar
                  name={lead.assignedTo?.name || 'Unassigned'}
                  size="md"
                  className={cn(
                    'ring-2',
                    lead.assignedTo?.name ? 'ring-emerald-500/30' : 'ring-amber-500/30'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-content-primary">
                    {lead.assignedTo?.name || 'Unassigned'}
                  </p>
                  <p className="text-xs text-content-muted">{assigneeLabel(lead)}</p>
                </div>
                {!lead.assignedTo?.name && onAssign && (
                  <button
                    type="button"
                    onClick={() => onAssign(lead)}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-brand-600 px-3 py-2 text-[11px] font-semibold text-white shadow-md shadow-violet-500/20"
                  >
                    Assign now
                  </button>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-content-muted">Follow Ups</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-subtle bg-surface-elevated/50 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-content-muted">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Last</span>
                  </div>
                  <p className="text-xs font-semibold text-content-primary">
                    {lead.lastFollowUp
                      ? new Date(lead.lastFollowUp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-brand-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Next</span>
                  </div>
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">
                    {lead.nextFollowUp
                      ? new Date(lead.nextFollowUp).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </section>

            {lead.notes && (
              <section>
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-content-muted">Notes</h3>
                <p className="rounded-2xl border border-subtle bg-surface-elevated/40 p-4 text-sm italic leading-relaxed text-content-secondary">
                  &ldquo;{lead.notes}&rdquo;
                </p>
              </section>
            )}
          </div>

          <div className="shrink-0 space-y-2.5 border-t border-violet-500/10 bg-gradient-to-t from-violet-500/[0.04] to-transparent p-4">
            {onAssign && (
              <Button
                type="button"
                className="h-11 w-full gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-brand-600 text-sm font-semibold shadow-lg shadow-violet-500/25 hover:brightness-110"
                onClick={() => onAssign(lead)}
              >
                <UserPlus className="w-4 h-4" />
                {lead.assignedTo?.name ? 'Reassign Lead' : 'Assign Lead'}
              </Button>
            )}
            <div className={cn('grid gap-2', canEditLead ? 'grid-cols-2' : 'grid-cols-1')}>
              <Link to={`/leads/${lead._id}`} className="block">
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 rounded-2xl border-violet-500/20 bg-white/50 dark:bg-slate-900/40"
                >
                  <ExternalLink className="w-4 h-4" />
                  Full Profile
                </Button>
              </Link>
              {canEditLead && (
                <Link to={`/leads/${lead._id}/edit`} className="block">
                  <Button className="h-11 w-full gap-2 rounded-2xl">
                    <Pencil className="w-4 h-4" />
                    Edit Lead
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </AppDrawer>
  );
}
