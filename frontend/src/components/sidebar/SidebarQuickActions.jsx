import { Link } from 'react-router-dom';
import { ChevronRight, Plus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../../context/SidebarContext';
import { cn } from '../../lib/utils';

const DEFAULT_QUICK_ACTIONS = [
  { path: '/leads/new', label: 'Add New Lead', icon: Plus },
  { path: '/quotations/new', label: 'Create Quotation', icon: FileText },
];

export default function SidebarQuickActions({ actions }) {
  const { collapsed, setMobileOpen } = useSidebar();
  const quickActions = actions ?? DEFAULT_QUICK_ACTIONS;

  if (collapsed || !quickActions.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-2 pb-3"
      >
        <div
          className={cn(
            'rounded-2xl border border-white/[0.08] p-3',
            'bg-gradient-to-br from-violet-900/60 via-indigo-900/50 to-slate-900/60',
            'shadow-lg shadow-black/20'
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Quick Actions
          </p>
          <div className="space-y-0.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-xl text-[13px] font-medium text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors group"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-violet-400 shrink-0" strokeWidth={2} />
                  <span className="flex-1 truncate">{action.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              );
            })}
          </div>
          {quickActions.length === 1 && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-end justify-center gap-1 h-8 opacity-40" aria-hidden>
              {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-sm bg-violet-400/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
