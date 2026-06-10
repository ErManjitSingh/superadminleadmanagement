import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import Avatar from '../ui/Avatar';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import { formatLeadId } from '../leads/constants';
import { normalizeLeadStatus } from '../../utils/leadUtils';

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-subtle last:border-0 text-sm">
      <span className="text-content-muted shrink-0">{label}</span>
      <span className="text-content-primary text-right capitalize">{value || '—'}</span>
    </div>
  );
}

export default function LeadCustomerPanel({ lead }) {
  const status = normalizeLeadStatus(lead.status);

  return (
    <div className="space-y-4">
      {/* Customer Card */}
      <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
        <div className="flex flex-col items-center text-center mb-5">
          <Avatar name={lead.name} size="lg" className="!w-16 !h-16 !text-xl mb-3" />
          <h2 className="text-lg font-bold text-content-primary">{lead.name}</h2>
          <p className="font-mono text-xs text-brand-600 mt-0.5">{formatLeadId(lead._id)}</p>
          <div className="mt-3">
            <LeadStatusBadge status={status} pulse={status === 'new'} />
          </div>
        </div>

        <div className="space-y-2">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-elevated text-sm text-content-secondary transition-colors">
              <Phone className="w-4 h-4 text-brand-600 shrink-0" /> {lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-surface-elevated text-sm text-content-secondary transition-colors">
              <Mail className="w-4 h-4 text-content-muted shrink-0" /> {lead.email}
            </a>
          )}
          <div className="flex items-center gap-2.5 p-2.5 text-sm text-content-secondary">
            <MapPin className="w-4 h-4 text-content-muted shrink-0" /> {lead.city || 'Mumbai'}
          </div>
        </div>
      </div>

      {/* Travel Info */}
      <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
        <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-3">Travel Information</h3>
        <InfoRow label="Destination" value={lead.destination} />
        <InfoRow label="Travel Date" value={lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
        <InfoRow label="Adults" value={lead.adults ?? Math.max(1, (lead.travelers || 2) - (lead.children || 0))} />
        <InfoRow label="Children" value={lead.children ?? 0} />
        <InfoRow label="Budget" value={`₹${lead.budget?.toLocaleString('en-IN')}`} />
        <InfoRow label="Source" value={lead.sourceShort || lead.sourceLabel || lead.source} />
      </div>

      {lead.lastContactedAt && (
        <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
          <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-3">Last Contact</h3>
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-content-muted shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-content-primary font-medium capitalize">
                {lead.lastContactMethod || 'contact'}
              </p>
              <p className="text-content-muted text-xs mt-0.5">
                {new Date(lead.lastContactedAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {lead.lastContactedBy?.name && (
                <p className="text-content-muted text-xs mt-1">by {lead.lastContactedBy.name}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assignment */}
      <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
        <h3 className="text-xs font-medium uppercase tracking-wider text-content-muted mb-3">Assignment</h3>
        {lead.assignedTo?.name ? (
          <div className="flex items-center gap-3">
            <Avatar name={lead.assignedTo.name} />
            <div>
              <p className="text-sm font-medium text-content-primary">{lead.assignedTo.name}</p>
              <p className="text-xs text-content-muted capitalize">
                {(lead.assigneeRole || 'sales_executive').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar name="Unassigned" />
            <p className="text-sm text-content-muted">Not assigned yet</p>
          </div>
        )}
      </div>

    </div>
  );
}
