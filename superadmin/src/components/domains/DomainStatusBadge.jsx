import { cn } from '../../lib/utils';

const DNS_BADGES = {
  verified: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  failed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  not_connected: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

const SSL_BADGES = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  generating: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  failed: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  expired: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  not_applicable: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

const DNS_LABELS = {
  verified: 'Verified',
  pending: 'Pending',
  failed: 'Failed',
  not_connected: 'Not Connected',
};

const SSL_LABELS = {
  active: 'SSL Active',
  generating: 'Generating',
  pending: 'Pending',
  failed: 'SSL Failed',
  expired: 'SSL Expired',
  not_applicable: 'Platform SSL',
};

export function DnsStatusBadge({ status, className }) {
  const key = status || 'not_connected';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', DNS_BADGES[key] || DNS_BADGES.pending, className)}>
      {DNS_LABELS[key] || key}
    </span>
  );
}

export function SslStatusBadge({ status, className }) {
  const key = status || 'not_applicable';
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', SSL_BADGES[key] || SSL_BADGES.pending, className)}>
      {SSL_LABELS[key] || key}
    </span>
  );
}

export function DomainConnectedBadge({ connected, className }) {
  return (
    <span className={cn(
      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
      connected ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-slate-500/15 text-slate-600',
      className,
    )}
    >
      {connected ? 'Domain Connected' : 'Domain Not Connected'}
    </span>
  );
}
