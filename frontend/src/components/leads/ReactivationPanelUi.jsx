import { motion } from 'framer-motion';
import {
  RefreshCw,
  UserCheck,
  Phone,
  CalendarClock,
  FileText,
  Trophy,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export const REACTIVATION_STAGE_KPIS = [
  { key: 'reactivated', label: 'Reactivated', icon: RefreshCw, color: 'teal', stage: 'reactivated' },
  { key: 'reassigned', label: 'Reassigned', icon: UserCheck, color: 'cyan', stage: 'reassigned' },
  { key: 'contacted', label: 'Contacted', icon: Phone, color: 'violet', stage: 'contacted' },
  { key: 'followUpScheduled', label: 'Follow Up', icon: CalendarClock, color: 'amber', stage: 'follow_up_scheduled' },
  { key: 'quotationSent', label: 'Quotation', icon: FileText, color: 'indigo', stage: 'quotation_sent' },
  { key: 'converted', label: 'Converted', icon: Trophy, color: 'emerald', stage: 'converted' },
];

const KPI_COLORS = {
  teal: 'border-teal-500/35 bg-gradient-to-br from-teal-500/20 to-cyan-500/10 hover:ring-teal-500/40 text-teal-700 dark:text-teal-300',
  cyan: 'border-cyan-500/35 bg-gradient-to-br from-cyan-500/20 to-sky-500/10 hover:ring-cyan-500/40 text-cyan-700 dark:text-cyan-300',
  violet: 'border-violet-500/35 bg-gradient-to-br from-violet-500/20 to-purple-500/10 hover:ring-violet-500/40 text-violet-700 dark:text-violet-300',
  amber: 'border-amber-500/35 bg-gradient-to-br from-amber-500/20 to-orange-500/10 hover:ring-amber-500/40 text-amber-700 dark:text-amber-300',
  indigo: 'border-indigo-500/35 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 hover:ring-indigo-500/40 text-indigo-700 dark:text-indigo-300',
  emerald: 'border-emerald-500/35 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 hover:ring-emerald-500/40 text-emerald-700 dark:text-emerald-300',
};

export function ReactivationHeroBanner({
  title,
  subtitle,
  total,
  loading,
  theme = 'reactivated',
  icon: Icon = RefreshCw,
}) {
  const isLost = theme === 'lost';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl',
        isLost
          ? 'border-slate-500/25 bg-gradient-to-r from-slate-500/15 via-zinc-500/10 to-neutral-500/10'
          : 'border-teal-500/30 bg-gradient-to-r from-teal-500/25 via-cyan-500/15 to-emerald-500/15'
      )}
    >
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />
      <div className="flex flex-wrap items-center justify-between gap-4 relative">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'p-3 rounded-2xl bg-surface/80 shadow-sm',
              isLost ? 'text-slate-500' : 'text-teal-600'
            )}
          >
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-2xl font-bold text-content-primary tabular-nums">{loading ? '—' : total}</p>
            <p className="text-sm font-medium text-content-primary">{title}</p>
            <p className="text-xs text-content-muted mt-0.5 max-w-md">{subtitle}</p>
          </div>
        </div>
        {!isLost && (
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-500/10 px-3 py-2 rounded-full ring-1 ring-teal-500/25">
            <Sparkles className="w-3.5 h-3.5" />
            Recovery pipeline live
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ReactivationFlowSteps() {
  const steps = [
    { label: 'Executive marks Lost', tone: 'slate' },
    { label: 'TL / SM Reactivate', tone: 'teal' },
    { label: 'Executive Follow-up', tone: 'amber' },
    { label: 'Status → Active', tone: 'emerald' },
  ];
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-surface/60 p-4 overflow-x-auto">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted mb-3">Lead recovery flow</p>
      <div className="flex items-center gap-2 min-w-max">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <span
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ring-inset whitespace-nowrap',
                step.tone === 'slate' && 'bg-slate-500/10 text-slate-600 ring-slate-500/25',
                step.tone === 'teal' && 'bg-teal-500/10 text-teal-700 ring-teal-500/25',
                step.tone === 'amber' && 'bg-amber-500/10 text-amber-700 ring-amber-500/25',
                step.tone === 'emerald' && 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25'
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-content-muted shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReactivationStageKpis({ widget, activeStage, onStageClick }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {REACTIVATION_STAGE_KPIS.map(({ key, label, icon: Icon, color, stage }) => {
        const value = widget?.stageCounts?.[key] ?? 0;
        const isActive = activeStage === stage;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onStageClick?.(isActive ? '' : stage)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all ring-0 hover:ring-2',
              KPI_COLORS[color],
              isActive && 'ring-2 ring-offset-1 ring-offset-surface scale-[1.02] shadow-md'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-4 h-4 opacity-80" />
              {isActive && <span className="text-[9px] uppercase font-bold opacity-70">Filtered</span>}
            </div>
            <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
            <p className="text-2xl font-bold tabular-nums mt-0.5">{value}</p>
          </button>
        );
      })}
    </div>
  );
}

export function ReactivationFiltersPanel({
  search,
  onSearchChange,
  stage,
  onStageChange,
  status,
  onStatusChange,
  executiveId,
  onExecutiveChange,
  executives,
  from,
  onFromChange,
  to,
  onToChange,
  stages,
  statuses,
  onRefresh,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-surface/80 p-4 space-y-4 shadow-sm shadow-teal-500/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-content-primary">
          <Filter className="w-4 h-4 text-teal-600" />
          Filters
          {hasActiveFilters && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 ring-1 ring-teal-500/25">
              Active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-8 gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClear} className="h-8 gap-1 text-content-muted">
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-3">
          <Search className="w-4 h-4 text-teal-600/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, phone, destination…"
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-teal-500/20 bg-surface text-sm outline-none focus:ring-2 focus:ring-teal-500/35"
          />
        </div>
        <label className="block">
          <span className="text-[10px] uppercase font-semibold text-content-muted mb-1 block">Stage</span>
          <select value={stage} onChange={(e) => onStageChange(e.target.value)} className="input-premium h-10 w-full">
            {stages.map((s) => (
              <option key={s.value || 'all'} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase font-semibold text-content-muted mb-1 block">Status</span>
          <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="input-premium h-10 w-full">
            {statuses.map((s) => (
              <option key={s.value || 'all'} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase font-semibold text-content-muted mb-1 block">Executive</span>
          <select value={executiveId} onChange={(e) => onExecutiveChange(e.target.value)} className="input-premium h-10 w-full">
            <option value="">All executives</option>
            {executives.map((ex) => (
              <option key={ex._id} value={ex._id}>{ex.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase font-semibold text-content-muted mb-1 block">From date</span>
          <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="input-premium h-10 w-full" />
        </label>
        <label className="block">
          <span className="text-[10px] uppercase font-semibold text-content-muted mb-1 block">To date</span>
          <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="input-premium h-10 w-full" />
        </label>
      </div>
    </div>
  );
}

export function ReactivationEmptyState({ isLost }) {
  return (
    <div className="py-16 px-6 text-center">
      <div
        className={cn(
          'w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center',
          isLost ? 'bg-slate-500/10 text-slate-500' : 'bg-teal-500/10 text-teal-600'
        )}
      >
        {isLost ? <X className="w-7 h-7" /> : <RefreshCw className="w-7 h-7" />}
      </div>
      <p className="font-semibold text-content-primary">
        {isLost ? 'No lost leads in this view' : 'No reactivated leads yet'}
      </p>
      <p className="text-sm text-content-muted mt-1 max-w-sm mx-auto">
        {isLost
          ? 'Jab executive lead ko lost mark karega, yahan dikhegi. Reactivate button se wapas pipeline me la sakte ho.'
          : 'Lost lead par Reactivate karo — phir yahan recovery track hogi jab tak executive follow-up na daal de.'}
      </p>
    </div>
  );
}
