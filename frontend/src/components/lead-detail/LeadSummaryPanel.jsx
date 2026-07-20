import { ClipboardList } from 'lucide-react';
import { DETAIL_CARD } from './leadDetailUtils';
import { cn } from '../../lib/utils';
import { normalizeLeadStatus } from '../../utils/leadUtils';
import { getLeadStatusLabel } from '../../lib/leadStatusLabel';

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-white text-right">{value}</span>
    </div>
  );
}

function formatBudget(lead) {
  if (lead.budgetRange && lead.budgetRange !== 'custom') {
    const map = {
      under_20000: 'Under ₹20,000',
      '20000_40000': '₹20,000 - ₹40,000',
      '40000_60000': '₹40,000 - ₹60,000',
      '60000_100000': '₹60,000 - ₹1,00,000',
      above_100000: 'Above ₹1,00,000',
    };
    if (map[lead.budgetRange]) return map[lead.budgetRange];
  }
  if (lead.budget) {
    const n = Number(lead.budget);
    const low = Math.round(n * 0.9 / 1000) * 1000;
    const high = Math.round(n * 1.1 / 1000) * 1000;
    return `₹${low.toLocaleString('en-IN')} - ₹${high.toLocaleString('en-IN')}`;
  }
  return '—';
}

function travelersLabel(lead) {
  const adults = lead.adults ?? Math.max(1, (lead.travelers || 1) - (lead.children || 0));
  const children = lead.children || 0;
  if (children > 0) return `${adults} Adults, ${children} Children`;
  return `${adults} Adult${adults === 1 ? '' : 's'}`;
}

function priorityBadge(priority = 'medium') {
  const p = String(priority || 'medium').toLowerCase();
  const tones = {
    high: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize', tones[p] || tones.medium)}>
      {p}
    </span>
  );
}

function statusBadge(status) {
  const active = !['lost', 'booked_from_another_company', 'converted'].includes(status);
  return (
    <span
      className={cn(
        'inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold',
        active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
      )}
    >
      {active ? 'Active' : getLeadStatusLabel(status)}
    </span>
  );
}

export default function LeadSummaryPanel({ lead }) {
  const status = normalizeLeadStatus(lead.status);
  const travelDate = lead.travelDate
    ? new Date(lead.travelDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className={cn(DETAIL_CARD, 'h-full')}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Summary</h3>
      </div>
      <div className="px-5 py-1">
        <Row label="Estimated Budget" value={formatBudget(lead)} />
        <Row label="Preferred Destination" value={lead.destination?.trim() || '—'} />
        <Row label="Travel Date" value={travelDate} />
        <Row label="No. of Travelers" value={travelersLabel(lead)} />
        <Row label="Lead Priority" value={priorityBadge(lead.priority)} />
        <Row label="Status" value={statusBadge(status)} />
      </div>
    </div>
  );
}
