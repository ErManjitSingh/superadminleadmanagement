import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FilterChip, StatusBadge } from './paymentsUi';
import { DEMO_TRANSACTIONS } from './paymentsDemoData';
import { formatDate, formatINRFull, METHOD_LABELS } from './paymentsUtils';
import { cn } from '../../lib/utils';

const METHODS = ['all', 'upi', 'card', 'bank_transfer', 'cash', 'net_banking'];
const TXN_STATUS = {
  success: { label: 'Success', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' },
  failed: { label: 'Failed', className: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25' },
};

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DEMO_TRANSACTIONS.filter((t) => {
      if (method !== 'all' && t.method !== method) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (!q) return true;
      return [t.id, t.ref, t.party, t.gateway, t.bank].join(' ').toLowerCase().includes(q);
    });
  }, [search, method, status]);

  const exportCsv = () => {
    const header = ['ID', 'Date', 'Party', 'Amount', 'Type', 'Method', 'Gateway', 'Bank', 'Reference', 'Status'];
    const lines = filtered.map((t) =>
      [t.id, formatDate(t.date), t.party, t.amount, t.type, t.method, t.gateway, t.bank, t.ref, t.status].join(',')
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Master ledger of every credit and debit"
        breadcrumbs={['Payments', 'Transactions']}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export Excel
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border border-subtle bg-surface p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search amount, reference, gateway, bank…"
            className="input-premium w-full pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <FilterChip key={m} active={method === m} onClick={() => setMethod(m)}>
              {m === 'all' ? 'All methods' : METHOD_LABELS[m] || m}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'success', 'pending', 'failed'].map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
              {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <article
            key={t.id}
            className="flex flex-col gap-3 rounded-2xl border border-subtle bg-surface p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white',
                  t.type === 'credit' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'
                )}
              >
                {t.type === 'credit' ? 'CR' : 'DR'}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-content-primary">{t.party}</h3>
                  <StatusBadge status={t.status} map={TXN_STATUS} />
                </div>
                <p className="mt-0.5 text-xs text-content-muted">
                  {t.id} · {t.ref} · {t.gateway} · {t.bank}
                </p>
                <p className="text-xs text-content-muted">
                  {formatDate(t.date)} · {METHOD_LABELS[t.method] || t.method}
                </p>
              </div>
            </div>
            <p
              className={cn(
                'text-xl font-bold metric-tabular shrink-0',
                t.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {t.type === 'credit' ? '+' : '-'}
              {formatINRFull(t.amount)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
