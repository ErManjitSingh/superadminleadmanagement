import { useMemo, useState } from 'react';
import { Building2, FileText, History, Wallet } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { FilterChip, PaymentProgressBar, StatusBadge } from './paymentsUi';
import { DEMO_SUPPLIERS } from './paymentsDemoData';
import { formatDate, formatINRFull } from './paymentsUtils';
import { cn } from '../../lib/utils';

const TYPES = ['all', 'Hotels', 'Transport', 'Guides', 'Activities', 'Flights', 'Vendors'];

const TYPE_GRADIENT = {
  Hotels: 'from-sky-500 to-blue-600',
  Transport: 'from-amber-500 to-orange-600',
  Guides: 'from-emerald-500 to-teal-600',
  Activities: 'from-fuchsia-500 to-pink-600',
  Flights: 'from-violet-500 to-indigo-600',
  Vendors: 'from-slate-500 to-slate-700',
};

export default function SupplierPaymentsPage() {
  const [type, setType] = useState('all');

  const filtered = useMemo(
    () => (type === 'all' ? DEMO_SUPPLIERS : DEMO_SUPPLIERS.filter((s) => s.type === type)),
    [type]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Payments"
        description="Hotels, transport, guides, activities, flights, and vendors"
        breadcrumbs={['Payments', 'Supplier Payments']}
      />

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
            {t === 'all' ? 'All suppliers' : t}
          </FilterChip>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s, i) => (
          <article
            key={s.id}
            className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow', TYPE_GRADIENT[s.type])}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-content-primary">{s.name}</h3>
                  <p className="text-xs text-content-muted">{s.type}</p>
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-surface-muted/40 px-2 py-2">
                <p className="text-[10px] text-content-muted">Due</p>
                <p className="text-sm font-bold metric-tabular">{formatINRFull(s.amountDue)}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 px-2 py-2">
                <p className="text-[10px] text-content-muted">Paid</p>
                <p className="text-sm font-bold text-emerald-600 metric-tabular">{formatINRFull(s.paid)}</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 px-2 py-2">
                <p className="text-[10px] text-content-muted">Pending</p>
                <p className="text-sm font-bold text-amber-600 metric-tabular">{formatINRFull(s.pending)}</p>
              </div>
            </div>

            <PaymentProgressBar total={s.amountDue} received={s.paid} className="mt-4" />
            <p className="mt-3 text-xs text-content-muted">Due date · {formatDate(s.dueDate)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                <Wallet className="h-3.5 w-3.5" /> Pay
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> View Bill
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <History className="h-3.5 w-3.5" /> History
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
