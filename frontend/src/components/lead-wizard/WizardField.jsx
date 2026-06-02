import { cn } from '../../lib/utils';

export default function WizardField({ label, required, error, hint, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-content-primary">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-content-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function WizardInput({ className, error, ...props }) {
  return (
    <input
      className={cn(
        'input-premium w-full h-11 rounded-xl text-sm',
        error && 'border-red-500/50 focus:ring-red-500/30',
        className
      )}
      {...props}
    />
  );
}

export function WizardSelect({ className, error, children, ...props }) {
  return (
    <select
      className={cn(
        'input-premium w-full h-11 rounded-xl text-sm',
        error && 'border-red-500/50 focus:ring-red-500/30',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function WizardTextarea({ className, error, ...props }) {
  return (
    <textarea
      className={cn(
        'input-premium w-full rounded-xl text-sm resize-none min-h-[100px]',
        error && 'border-red-500/50 focus:ring-red-500/30',
        className
      )}
      {...props}
    />
  );
}
