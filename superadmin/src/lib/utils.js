import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  inactive: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  suspended: 'bg-red-500/15 text-red-700 dark:text-red-300',
  trial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  expired: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
};
