import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTimeGreeting } from '../../lib/greeting';

export default function DashboardHeader() {
  const { user } = useAuth();
  const greeting = useTimeGreeting();
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"
    >
      <div>
        <p className="text-sm text-content-muted mb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {today}
        </p>
        <h1 className="text-2xl sm:text-[28px] font-bold text-content-primary tracking-tight leading-tight">
          {greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-content-secondary mt-1 max-w-lg">
          Here&apos;s what&apos;s happening with your travel leads today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/leads/new-leads"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-brand-600 hover:bg-brand-500/10 transition-colors"
        >
          New leads <ArrowUpRight className="w-4 h-4" />
        </Link>
        <Link
          to="/leads"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-content-secondary hover:bg-surface-elevated transition-colors"
        >
          View all <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
