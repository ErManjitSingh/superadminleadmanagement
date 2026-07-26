import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Flame, Sparkles, Lightbulb } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarCounts } from '../../hooks/useSidebarCounts';
import { ROLE_LABELS } from '../../auth/constants';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

const TIPS = [
  'Call new leads within 15 minutes — response speed wins deals.',
  'Log every follow-up. Missed notes lose conversions.',
  'Hot leads first: prioritize urgency before volume.',
  'Confirm travel dates early to tighten your quotation.',
  'A short WhatsApp check-in keeps warm leads engaged.',
  'Ask for the decision-maker on the first call.',
  'Review overdue follow-ups before picking new leads.',
];

function getInitials(name) {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'EX'
  );
}

function tipForToday() {
  const day = new Date().getDay();
  return TIPS[day % TIPS.length];
}

function StatChip({ to, icon: Icon, label, value, tone, onNavigate }) {
  const tones = {
    amber: 'text-amber-300 bg-amber-500/15 border-amber-500/25 hover:bg-amber-500/25',
    rose: 'text-rose-300 bg-rose-500/15 border-rose-500/25 hover:bg-rose-500/25',
    violet: 'text-violet-300 bg-violet-500/15 border-violet-500/25 hover:bg-violet-500/25',
  };

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-xl border px-1.5 py-1.5 transition-colors min-w-0',
        tones[tone]
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
      <span className="text-sm font-bold tabular-nums leading-none">{value ?? '—'}</span>
      <span className="text-[9px] font-medium uppercase tracking-wide opacity-80 truncate w-full text-center">
        {label}
      </span>
    </Link>
  );
}

export default function ExecutiveSidebarFooter({ user }) {
  const { collapsed, setMobileOpen } = useSidebar();
  const counts = useSidebarCounts();
  const tip = tipForToday();
  const closeMobile = () => setMobileOpen(false);

  const due = counts?.followups?.due ?? 0;
  const hot = counts?.leads?.hot ?? 0;
  const neu = counts?.leads?.new ?? 0;
  const roleLabel = ROLE_LABELS[user?.role] || user?.roleName || 'Sales Executive';
  const initials = getInitials(user?.name);

  if (collapsed) {
    return (
      <div className="p-2 border-t border-white/[0.06] space-y-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/sales-executive/follow-ups"
              onClick={closeMobile}
              className="relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
            >
              <CalendarClock className="w-4 h-4" />
              {due > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                  {due > 99 ? '99+' : due}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold">{due} follow-ups due</p>
            <p className="text-content-muted">{hot} hot · {neu} new</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/sales-executive/profile"
              onClick={closeMobile}
              className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-[11px] font-bold text-white shadow-md"
            >
              {initials}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold">{user?.name || 'Executive'}</p>
            <p className="text-content-muted">{roleLabel}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-2 pb-3 pt-1 border-t border-white/[0.06] space-y-2"
      >
        <div
          className={cn(
            'rounded-2xl border border-white/[0.08] p-3',
            'bg-gradient-to-br from-violet-900/50 via-indigo-900/40 to-slate-900/50',
            'shadow-lg shadow-black/20'
          )}
        >
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Today&apos;s Focus
            </p>
            <span className="text-[10px] text-slate-500 tabular-nums">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <StatChip
              to="/sales-executive/follow-ups"
              icon={CalendarClock}
              label="Due"
              value={due}
              tone="amber"
              onNavigate={closeMobile}
            />
            <StatChip
              to="/sales-executive/leads/hot"
              icon={Flame}
              label="Hot"
              value={hot}
              tone="rose"
              onNavigate={closeMobile}
            />
            <StatChip
              to="/sales-executive/leads/new"
              icon={Sparkles}
              label="New"
              value={neu}
              tone="violet"
              onNavigate={closeMobile}
            />
          </div>

          <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex gap-2 items-start">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[11px] leading-snug text-slate-400">{tip}</p>
          </div>
        </div>

        <Link
          to="/sales-executive/profile"
          onClick={closeMobile}
          className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] px-2.5 py-2 transition-colors"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0f172a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-200 truncate">{user?.name || 'Executive'}</p>
            <p className="text-[10px] text-slate-500 truncate">{roleLabel} · Online</p>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
