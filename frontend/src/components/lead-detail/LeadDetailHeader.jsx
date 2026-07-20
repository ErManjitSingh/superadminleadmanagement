import { Link } from 'react-router-dom';
import { Phone, MapPin, Copy, Flame, Check, Pencil } from 'lucide-react';
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

function MetricRow({ label, children, valueClass = '' }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100/90 dark:border-slate-800 last:border-0">
      <span className="text-[12px] text-slate-500 shrink-0">{label}</span>
      <div className={cn('text-sm font-bold text-slate-900 dark:text-white text-right', valueClass)}>{children}</div>
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
    <svg width="42" height="16" viewBox="0 0 48 18" className="text-emerald-500 shrink-0" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
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

  const tempTone =
    tempLabel === 'Hot' ? 'text-orange-600' : tempLabel === 'Warm' ? 'text-amber-600' : 'text-sky-600';

  return (
    <div className="mb-5">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-500 mb-4"
      >
        ← {backLabel}
      </Link>

      <div className={cn(DETAIL_CARD, 'overflow-hidden')}>
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(180px,220px)_240px] gap-5 items-center">
          {/* Identity */}
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={cn(
                'w-[76px] h-[76px] rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg shadow-violet-500/30',
                isConverted
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-[#7c3aed] to-[#4f46e5]'
              )}
            >
              {getInitials(lead.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-[26px] leading-tight font-bold text-slate-900 dark:text-white tracking-tight">
                  {lead.name}
                </h1>
                <LeadStatusBadge status={status} pulse={status === 'new'} />
              </div>
              <p className="text-sm text-slate-500 mb-4">
                <span className="font-medium text-slate-600">{formatLeadId(lead._id || lead.leadId)}</span>
                <span className="mx-1.5 text-slate-300">·</span>
                {destination}
                <span className="mx-1.5 text-slate-300">·</span>
                Lead 360
              </p>

              <div className="flex flex-wrap gap-2.5">
                {lead.phone && (
                  <button
                    type="button"
                    onClick={copyPhone}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-violet-50 text-violet-600 inline-flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    {lead.phone}
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <span className="text-base leading-none" aria-hidden>🇮🇳</span>
                  <MapPin className="w-3.5 h-3.5 text-violet-500" />
                  {[lead.city, lead.state].filter(Boolean).join(', ') || 'India'}
                </span>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <img
              src={`${import.meta.env.BASE_URL}illustrations/lead-hero.png`}
              alt=""
              className="w-full max-w-[220px] h-auto object-contain drop-shadow-md"
            />
          </div>

          {/* Metrics panel */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 dark:bg-slate-800/40 dark:border-slate-700 px-4 py-2">
            <MetricRow label="Lead Score" valueClass="text-emerald-600">
              <span className="inline-flex items-center gap-2">
                {scores.overall}/100
                <ScoreSparkline />
              </span>
            </MetricRow>
            <MetricRow label="Lead Temperature">
              <span className={cn('inline-flex items-center gap-1', tempTone)}>
                <Flame className="w-3.5 h-3.5" /> {tempLabel}
              </span>
            </MetricRow>
            <MetricRow label="Source">{formatSource(lead)}</MetricRow>
            <MetricRow label="Created On">
              {lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </MetricRow>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[12px] text-slate-500">Assigned To</span>
              <div className="flex items-center gap-2 min-w-0">
                {lead.assignedTo?.name ? (
                  <>
                    <Avatar name={lead.assignedTo.name} size="sm" className="!w-6 !h-6" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {lead.assignedTo.name}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">Unassigned</span>
                )}
                <span className="p-1 rounded-md text-slate-400">
                  <Pencil className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
