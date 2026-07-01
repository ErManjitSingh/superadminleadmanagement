import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('glass-card p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-lg font-semibold tracking-tight', className)}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={cn('text-sm text-[var(--text-secondary)]', className)}>{children}</p>;
}
