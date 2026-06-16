import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTimeGreeting } from '../../lib/greeting';
import { RefreshCw, ChevronDown, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DashboardHeader({ onRefresh, isRefreshing = false }) {
  const { user } = useAuth();
  const greeting = useTimeGreeting();
  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-content-primary tracking-tight leading-tight">
          {greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-sm text-content-secondary mt-1">
          Here&apos;s what&apos;s happening with your travel business today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-subtle bg-surface text-sm font-medium text-content-primary hover:bg-surface-elevated transition-colors"
        >
          <Calendar className="w-4 h-4 text-content-muted" />
          {today}
          <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-subtle bg-surface text-sm font-medium text-content-primary hover:bg-surface-elevated transition-colors"
        >
          This Month
          <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
        </button>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-subtle bg-surface text-sm font-semibold text-content-primary hover:bg-surface-elevated transition-colors',
              'disabled:opacity-70'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        )}
      </div>
    </motion.div>
  );
}
