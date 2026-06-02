import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white',
        secondary: 'bg-surface-elevated text-content-secondary border border-subtle',
        destructive: 'bg-red-500 text-white',
        warning: 'bg-amber-500 text-white',
        success: 'bg-emerald-500 text-white',
        outline: 'border border-subtle text-content-secondary',
      },
      size: {
        sm: 'h-5 min-w-5 px-1.5 text-[10px]',
        md: 'h-6 min-w-6 px-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

export function Badge({ className, variant, size, ...props }) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
