import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium',
    'transition-all duration-150 appearance-none cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)]',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white hover:bg-brand-500 shadow-sm shadow-brand-600/20 border border-brand-600 hover:border-brand-500',
        secondary:
          'bg-slate-100 text-content-primary hover:bg-slate-200/90 border border-strong shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700',
        ghost:
          'text-content-secondary hover:bg-slate-100 hover:text-content-primary border border-transparent dark:hover:bg-slate-800/80',
        outline:
          'border border-strong bg-slate-50 text-content-primary hover:bg-slate-100 shadow-sm dark:bg-slate-800/60 dark:hover:bg-slate-800',
        destructive:
          'bg-red-600 text-white hover:bg-red-500 shadow-sm border border-red-600 hover:border-red-500',
        violet:
          'bg-violet-600 text-white hover:bg-violet-500 shadow-sm shadow-violet-600/20 border border-violet-600 hover:border-violet-500',
        sky:
          'bg-sky-600 text-white hover:bg-sky-500 shadow-sm shadow-sky-600/20 border border-sky-600 hover:border-sky-500',
        emerald:
          'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/20 border border-emerald-600 hover:border-emerald-500',
        teal:
          'bg-teal-600 text-white hover:bg-teal-500 shadow-sm shadow-teal-600/20 border border-teal-600 hover:border-teal-500',
        amber:
          'bg-amber-600 text-white hover:bg-amber-500 shadow-sm shadow-amber-600/20 border border-amber-600 hover:border-amber-500',
        gradient:
          'bg-gradient-to-r from-violet-600 to-brand-600 text-white hover:from-violet-500 hover:to-brand-500 shadow-md shadow-violet-600/25 border-0',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-xl px-6 text-sm',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, ...props },
  ref,
) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  );
});

export { buttonVariants };
