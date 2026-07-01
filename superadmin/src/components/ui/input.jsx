import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900/60',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[96px] w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900/60',
        className
      )}
      {...props}
    />
  );
});

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('mb-1.5 block text-sm font-medium text-[var(--text-secondary)]', className)} {...props}>
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-900/60',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
