import { motion } from 'framer-motion';
import { LogIn, LogOut, UserPlus, Pencil, FileText, Shield, Search, Clock } from 'lucide-react';
import { ACTIVITY_TYPES } from './constants';

const iconMap = { LogIn, LogOut, UserPlus, Pencil, FileText, Shield };

const typeColors = {
  login: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  logout: 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
  lead_created: 'bg-sky-500/10 text-sky-600 ring-sky-500/20',
  lead_updated: 'bg-violet-500/10 text-violet-600 ring-violet-500/20',
  quotation_created: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  user_action: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
};

function getIcon(type) {
  const cfg = ACTIVITY_TYPES.find((t) => t.value === type);
  return iconMap[cfg?.icon] || Shield;
}

export default function ActivityLogPanel({ logs, filters, onFilterChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-content-secondary">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong className="text-content-primary">Last 24 hours only</strong> — purane logs auto-delete ho jate hain.
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
          <input
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search activity logs…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-surface/80 backdrop-blur-xl text-sm focus:ring-2 focus:ring-brand-500/30 outline-none"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
          className="px-4 py-2.5 rounded-xl border border-subtle bg-surface/80 backdrop-blur-xl text-sm focus:ring-2 focus:ring-brand-500/30 outline-none"
        >
          <option value="">All Types</option>
          {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        {!logs.length ? (
          <div className="p-12 text-center text-content-muted">No activity in the last 24 hours</div>
        ) : (
          <div className="divide-y divide-subtle">
            {logs.map((log, i) => {
              const Icon = getIcon(log.type);
              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-brand-500/[0.02] transition-colors"
                >
                  <div className={`p-2.5 rounded-xl ring-1 ring-inset shrink-0 ${typeColors[log.type] || typeColors.user_action}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-content-primary">{log.user}</span>
                      <span className="text-sm text-content-secondary">{log.action}</span>
                      {log.target !== '—' && (
                        <span className="text-sm font-medium text-brand-600 truncate">{log.target}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-content-muted">
                      <span>{new Date(log.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {log.ip && <span>IP: {log.ip}</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
