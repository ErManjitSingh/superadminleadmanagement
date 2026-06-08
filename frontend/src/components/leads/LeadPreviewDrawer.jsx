import { X, Phone, Mail, MapPin, Calendar, IndianRupee, Users, Pencil, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import LeadStatusBadge from './LeadStatusBadge';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/button';
import AppDrawer from '../ui/AppDrawer';
import { formatLeadId } from './constants';

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-subtle last:border-0">
      <Icon className="w-4 h-4 text-content-muted mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-content-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm text-content-primary mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );
}

function assigneeLabel(lead) {
  if (lead?.assigneeRole === 'sales_manager') return 'Sales Manager';
  if (lead?.assigneeRole === 'team_leader') return 'Team Leader';
  if (lead?.assignedManager?.name && lead.assignedTo?.name === lead.assignedManager.name) return 'Sales Manager';
  if (lead?.assignedTeamLeader?.name && lead.assignedTo?.name === lead.assignedTeamLeader.name) return 'Team Leader';
  return 'Travel Consultant';
}

export default function LeadPreviewDrawer({ lead, onClose, onAssign, canEditLead = true }) {
  return (
    <AppDrawer open={!!lead} onClose={onClose}>
      {lead && (
        <>
          <div className="flex items-start justify-between gap-4 p-5 border-b border-subtle shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={lead.name} size="lg" />
              <div className="min-w-0">
                <p className="font-mono text-xs text-brand-600 mb-0.5">{formatLeadId(lead._id)}</p>
                <h2 className="text-lg font-bold text-content-primary truncate">{lead.name}</h2>
                <LeadStatusBadge status={lead.status} pulse={lead.status === 'new'} />
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated text-content-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-2">Customer Details</h3>
              <div className="rounded-xl border border-subtle bg-surface-elevated/40 px-4">
                <DetailRow icon={Phone} label="Phone" value={lead.phone} />
                <DetailRow icon={Mail} label="Email" value={lead.email} />
              </div>
            </section>

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-2">Travel Details</h3>
              <div className="rounded-xl border border-subtle bg-surface-elevated/40 px-4">
                <DetailRow icon={MapPin} label="Destination" value={lead.destination} />
                <DetailRow icon={Calendar} label="Travel Date" value={lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                <DetailRow icon={IndianRupee} label="Budget" value={lead.budget ? `₹${lead.budget.toLocaleString('en-IN')}` : null} />
                <DetailRow icon={Users} label="Travelers" value={lead.travelers} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted">Assigned To</h3>
                {onAssign && (
                  <button
                    type="button"
                    onClick={() => onAssign(lead)}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-500 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Assign
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-subtle bg-surface-elevated/40">
                <Avatar name={lead.assignedTo?.name || 'Unassigned'} />
                <div>
                  <p className="text-sm font-medium text-content-primary">{lead.assignedTo?.name || 'Unassigned'}</p>
                  <p className="text-xs text-content-muted">{assigneeLabel(lead)}</p>
                </div>
              </div>
            </section>

            {lead.notes && (
              <section>
                <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-2">Notes</h3>
                <p className="text-sm text-content-secondary p-4 rounded-xl border border-subtle bg-surface-elevated/40 italic">
                  &ldquo;{lead.notes}&rdquo;
                </p>
              </section>
            )}

            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-2">Follow Ups</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 rounded-lg bg-surface-elevated/40 border border-subtle">
                  <span className="text-content-muted">Last</span>
                  <span className="text-content-primary">{lead.lastFollowUp ? new Date(lead.lastFollowUp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-surface-elevated/40 border border-subtle">
                  <span className="text-content-muted">Next</span>
                  <span className="text-brand-600 font-medium">{lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-subtle flex flex-col gap-2 shrink-0">
            {onAssign && (
              <Button type="button" className="w-full rounded-xl gap-2" onClick={() => onAssign(lead)}>
                <UserPlus className="w-4 h-4" /> Assign Lead
              </Button>
            )}
            <div className={canEditLead ? 'flex gap-2' : ''}>
              <Link to={`/leads/${lead._id}`} className={canEditLead ? 'flex-1' : 'block'}>
                <Button variant="outline" className="w-full rounded-xl">Full Profile</Button>
              </Link>
              {canEditLead && (
                <Link to={`/leads/${lead._id}/edit`} className="flex-1">
                  <Button className="w-full rounded-xl gap-2"><Pencil className="w-4 h-4" /> Edit</Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </AppDrawer>
  );
}
