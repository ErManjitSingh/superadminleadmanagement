import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { PAYMENT_STATUS, REFUND_STATUS, LINK_STATUS, paymentProgress, formatINRFull } from './paymentsUtils';

export function FinanceKpiCard({
  label,
  value,
  icon: Icon,
  gradient = 'from-violet-500 to-indigo-600',
  hint,
  index = 0,
  trend,
  format = 'number',
  suffix = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-2xl border border-subtle bg-surface p-5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className={cn('absolute inset-0 opacity-[0.07] bg-gradient-to-br', gradient)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', gradient)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        {trend != null && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      <p className="relative mt-4 text-xs font-medium text-content-muted">{label}</p>
      <p className="relative mt-1 text-2xl font-bold tracking-tight text-content-primary metric-tabular">
        <AnimatedCounter value={value} format={format} suffix={suffix} />
      </p>
      {hint && <p className="relative mt-1 text-[11px] text-content-muted">{hint}</p>}
    </motion.div>
  );
}

export function AnimatedCounter({ value, format = 'number', suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = performance.now();
    const duration = 700;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (format === 'inr') return formatINRFull(Math.round(display));
  if (format === 'percent') return `${display.toFixed(1)}${suffix || '%'}`;
  return `${Math.round(display).toLocaleString('en-IN')}${suffix}`;
}

export function StatusBadge({ status, map = PAYMENT_STATUS }) {
  const cfg = map[status] || map.pending || { label: status, className: 'bg-slate-500/15 text-slate-600 border-slate-500/25' };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', cfg.className)}>
      {cfg.label}
    </span>
  );
}

export function RefundStatusBadge({ status }) {
  return <StatusBadge status={status} map={REFUND_STATUS} />;
}

export function LinkStatusBadge({ status }) {
  return <StatusBadge status={status} map={LINK_STATUS} />;
}

export function PaymentProgressBar({ total, received, className }) {
  const pct = paymentProgress(total, received);
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-[11px] text-content-muted">
        <span>Received {formatINRFull(received)}</span>
        <span className="font-semibold text-content-secondary">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            pct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : pct >= 50 ? 'bg-gradient-to-r from-violet-500 to-indigo-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'
          )}
        />
      </div>
    </div>
  );
}

export function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300 shadow-sm'
          : 'border-subtle bg-surface text-content-secondary hover:bg-surface-muted'
      )}
    >
      {children}
    </button>
  );
}

export function SectionCard({ title, action, children, className, subtitle, period }) {
  return (
    <div className={cn('rounded-2xl border border-subtle bg-surface p-5 shadow-sm', className)}>
      {(title || action || period) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-content-primary">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[11px] text-content-muted">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {period && (
              <span className="rounded-lg border border-subtle bg-surface-muted/50 px-2.5 py-1 text-[11px] font-medium text-content-secondary">
                {period}
              </span>
            )}
            {action}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-subtle bg-surface/50 px-6 py-16 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-content-muted opacity-50" />}
      <p className="font-semibold text-content-primary">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-content-muted">{description}</p>}
    </div>
  );
}
