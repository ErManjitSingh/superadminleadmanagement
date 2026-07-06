import { motion } from 'framer-motion';
import { Wallet, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatINR } from '../operations-manager/operationsUtils';

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  partial: { label: 'Partial', className: 'bg-sky-500/15 text-sky-700 border-sky-500/30' },
  paid: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  overdue: { label: 'Overdue', className: 'bg-rose-500/15 text-rose-700 border-rose-500/30' },
};

export default function PaymentSummaryCard({ summary, className }) {
  if (!summary) return null;

  const {
    packageCost = 0,
    advanceReceived = 0,
    totalPaid = 0,
    remainingBalance = 0,
    paymentProgress = 0,
    paymentStatus = 'pending',
  } = summary;

  const statusCfg = STATUS_CONFIG[paymentStatus] || STATUS_CONFIG.pending;
  const progress = Math.min(100, Math.max(0, paymentProgress));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/5 via-violet-500/5 to-emerald-500/5 backdrop-blur-xl shadow-lg dark:from-slate-800/40 dark:via-violet-900/20',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content-primary">Payment Summary</h3>
              <p className="text-[11px] text-content-muted">Live booking balance</p>
            </div>
          </div>
          <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold', statusCfg.className)}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl bg-white/60 dark:bg-slate-900/40 p-3 border border-subtle/50">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-content-muted">Package Cost</p>
            <p className="text-lg font-black text-content-primary tabular-nums mt-0.5">{formatINR(packageCost)}</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Advance Received</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">{formatINR(advanceReceived)}</p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Remaining Balance</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 tabular-nums mt-0.5">{formatINR(remainingBalance)}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-content-muted flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Payment Progress</span>
            <span className="text-violet-600 font-bold tabular-nums">{progress}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/80 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 shadow-sm"
            />
          </div>
          <p className="text-[11px] text-content-muted mt-2 tabular-nums">
            Total paid: {formatINR(totalPaid)} of {formatINR(packageCost)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
