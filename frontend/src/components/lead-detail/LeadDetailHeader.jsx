import { Link } from 'react-router-dom';
import { Phone, MapPin, Copy, Flame, Check } from 'lucide-react';
import { useState } from 'react';
import { formatLeadId } from '../leads/constants';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import Avatar from '../ui/Avatar';
import { normalizeLeadStatus } from '../../utils/leadUtils';
import {
  getInitials,
  formatSource,
  computeLeadScores,
  DETAIL_CARD,
} from './leadDetailUtils';
import { cn } from '../../lib/utils';

function MetricCard({ label, value, valueClass = '', extra = null }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-sm">
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <div className={cn('text-sm font-bold text-slate-900 dark:text-white', valueClass)}>{value}</div>
        {extra}
      </div>
    </div>
  );
}

function LeadHeroIllustration() {
  return (
    <div className="hidden xl:flex relative w-[200px] h-[140px] shrink-0 items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-100/80 via-indigo-50 to-sky-50 rounded-2xl" />
      <svg viewBox="0 0 200 140" className="relative w-full h-full drop-shadow-md" aria-hidden>
        <rect x="48" y="28" width="70" height="88" rx="10" fill="#fff" stroke="#c4b5fd" strokeWidth="2" />
        <rect x="58" y="42" width="50" height="8" rx="3" fill="#ddd6fe" />
        <rect x="58" y="56" width="40" height="6" rx="2" fill="#ede9fe" />
        <rect x="58" y="68" width="46" height="6" rx="2" fill="#ede9fe" />
        <rect x="58" y="80" width="34" height="6" rx="2" fill="#ede9fe" />
        <circle cx="83" cy="102" r="10" fill="#8b5cf6" />
        <path d="M78 102 l3 3 6-7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <rect x="118" y="48" width="14" height="48" rx="4" fill="#a78bfa" opacity="0.85" />
        <rect x="136" y="36" width="14" height="60" rx="4" fill="#6366f1" opacity="0.9" />
        <rect x="154" y="58" width="14" height="38" rx="4" fill="#38bdf8" opacity="0.85" />
        <circle cx="168" cy="30" r="10" fill="#fbbf24" opacity="0.9" />
      </svg>
    </div>
  );
}

function resolveTemperature(lead, overallScore) {
  if (lead?.isHot || lead?.temperature === 'hot' || lead?.leadScore === 'hot') return 'Hot';
  if (lead?.temperature === 'cold' || lead?.leadScore === 'low') return 'Cold';
  if (lead?.temperature || lead?.leadScore) {
    const raw = String(lead.temperature || lead.leadScore);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (overallScore >= 70) return 'Hot';
  if (overallScore >= 40) return 'Warm';
  return 'Cold';
}

function ScoreSparkline() {
  return (
    <svg width="48" height="18" viewBox="0 0 48 18" className="text-emerald-500" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="1,14 8,12 14,13 20,8 26,10 32,5 38,7 47,2"
      />
    </svg>
  );
}

export default function LeadDetailHeader({ lead, backHref = '/leads', backLabel = 'Back to Leads' }) {
  const status = normalizeLeadStatus(lead.status);
  const scores = computeLeadScores(lead);
  const tempLabel = resolveTemperature(lead, scores.overall);
  const isConverted = status === 'converted';
  const destination = lead.destination?.trim() || 'Not specified';
  const [copied, setCopied] = useState(false);

  const copyPhone = async () => {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mb-5">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-500 mb-4"
      >
        ← {backLabel}
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4">
        <div className={cn(DETAIL_CARD, 'overflow-hidden')}>
          <div className="p-5 sm:p-6 flex items-start gap-5">
            <div
              className={cn(
                'w-[72px] h-[72px] rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg shadow-violet-500/25',
                isConverted
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-600'
              )}
            >
              {getInitials(lead.name)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{lead.name}</h1>
                <LeadStatusBadge status={status} pulse={status === 'new'} />
              </div>
              <p className="text-sm text-slate-500 mb-4">
                {formatLeadId(lead._id || lead.leadId)} · {destination} · Lead 360
              </p>

              <div className="flex flex-wrap gap-2.5">
                {lead.phone && (
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors"
                  >
                    <Phone className="w-4 h-4 text-violet-500" />
                    {lead.phone}
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <span className="text-base leading-none" aria-hidden>🇮🇳</span>
                  <MapPin className="w-3.5 h-3.5 text-violet-500" />
                  {[lead.city, lead.state].filter(Boolean).join(', ') || 'India'}
                </span>
              </div>
            </div>

            <LeadHeroIllustration />
          </div>
        </div>

        <div className="space-y-2.5">
          <MetricCard
            label="Lead Score"
            value={`${scores.overall}/100`}
            valueClass="text-emerald-600"
            extra={<ScoreSparkline />}
          />
          <MetricCard
            label="Lead Temperature"
            value={(
              <span className="inline-flex items-center gap-1 text-sky-600">
                <Flame className="w-3.5 h-3.5" /> {tempLabel}
              </span>
            )}
          />
          <MetricCard label="Source" value={formatSource(lead)} />
          <MetricCard
            label="Created On"
            value={
              lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          <MetricCard
            label="Assigned To"
            value={(
              <span className="inline-flex items-center gap-2">
                {lead.assignedTo?.name ? (
                  <>
                    <Avatar name={lead.assignedTo.name} size="sm" className="!w-6 !h-6" />
                    <span>{lead.assignedTo.name}</span>
                  </>
                ) : (
                  'Unassigned'
                )}
              </span>
            )}
          />
        </div>
      </div>
    </div>
  );
}
