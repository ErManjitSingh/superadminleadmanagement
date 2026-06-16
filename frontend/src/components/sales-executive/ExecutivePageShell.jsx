import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

function formatTodayDate() {
  return new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ExecutivePageShell({ title, description, action, showDate = true, children }) {
  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-content-primary tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-content-secondary mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {showDate && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-subtle bg-white dark:bg-slate-900 shadow-sm text-sm font-medium text-content-secondary">
              <CalendarDays className="w-4 h-4 text-violet-500" />
              {formatTodayDate()}
            </div>
          )}
          {action}
        </div>
      </motion.div>
      {children}
    </div>
  );
}
