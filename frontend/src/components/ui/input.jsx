import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-strong bg-surface px-3 text-sm outline-none transition placeholder:text-content-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        className
      )}
      {...props}
    />
  );
});

export function Label({ className, children, ...props }) {
  return (
    <label className={cn('mb-1.5 block text-sm font-medium text-content-secondary', className)} {...props}>
      {children}
    </label>
  );
}
