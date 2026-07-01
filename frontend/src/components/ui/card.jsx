import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-xl border border-strong bg-surface-elevated shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}
