import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Star, Flame, Pencil } from 'lucide-react';
import { formatLeadId } from '../leads/constants';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import Avatar from '../ui/Avatar';
import { normalizeLeadStatus } from '../../utils/leadUtils';
import {
  getInitials,
  formatSource,
  computeLeadScores,
  computeLeadAge,
  DETAIL_CARD,
} from './leadDetailUtils';
import { cn } from '../../lib/utils';

function MetricRow({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={cn('font-semibold text-slate-900 dark:text-white text-right', valueClass)}>{value}</span>
    </div>
  );
}

export default function LeadDetailHeader({ lead, backHref = '/leads', backLabel = 'Back to Leads' }) {
  const status = normalizeLeadStatus(lead.status);
  const scores = computeLeadScores(lead);
  const temperature = lead.isHot || lead.temperature === 'hot' ? 'Hot' : (lead.temperature || 'Warm');
  const tempCapitalized = temperature.charAt(0).toUpperCase() + temperature.slice(1);
  const isConverted = status === 'converted';

  return (
    <div className="mb-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-500 mb-4"
      >
        ← {backLabel}
      </Link>

      <div className={cn(DETAIL_CARD, 'overflow-hidden')}>
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="flex flex-col sm:flex-row gap-5 flex-1 min-w-0">
            <div
              className={cn(
                'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md',
                isConverted ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
              )}
            >
              {getInitials(lead.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{lead.name}</h1>
                <LeadStatusBadge status={status} pulse={status === 'new'} />
                {lead.isHot && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
              <p className="text-sm text-slate-500 mb-4">
                {formatLeadId(lead._id || lead.leadId)} · {lead.destination} · Lead 360
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-violet-600">
                    <Phone className="w-4 h-4 text-violet-500 shrink-0" />
                    <span className="truncate">{lead.phone}</span>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-violet-600">
                    <Mail className="w-4 h-4 text-violet-500 shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="truncate">{[lead.city, lead.state].filter(Boolean).join(', ') || 'India'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-[280px] shrink-0 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4">
            <MetricRow label="Lead Score" value={`${scores.overall}/100`} valueClass="text-emerald-600" />
            <MetricRow
              label="Lead Temperature"
              value={(
                <span className="inline-flex items-center gap-1 text-orange-600">
                  <Flame className="w-3.5 h-3.5" /> {tempCapitalized}
                </span>
              )}
            />
            <MetricRow label="Source" value={formatSource(lead)} />
            <MetricRow
              label="Created On"
              value={lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'}
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-sm text-slate-500">Assigned To</span>
              <div className="flex items-center gap-2 min-w-0">
                {lead.assignedTo?.name ? (
                  <>
                    <Avatar name={lead.assignedTo.name} size="sm" className="!w-7 !h-7 ring-2 ring-violet-200" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{lead.assignedTo.name}</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Unassigned</span>
                )}
                <button type="button" className="p-1 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50" aria-label="Edit assignment">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
