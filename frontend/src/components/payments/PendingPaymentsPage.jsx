import { MessageCircle, Phone, Bell, Banknote } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { StatusBadge } from './paymentsUi';
import { daysUntil, formatDate, formatINRFull, priorityCardClass, priorityFromDays } from './paymentsUtils';
import { useCustomerPayments } from './useCustomerPayments';
import { usePaymentsUi } from './PaymentsContext';
import { cn } from '../../lib/utils';

export default function PendingPaymentsPage() {
  const { payments } = useCustomerPayments();
  const { openPayment } = usePaymentsUi();

  const pending = payments
    .filter((p) => p.pending > 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Payments"
        description="Priority dues with quick collect and reminder actions"
        breadcrumbs={['Payments', 'Pending Payments']}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pending.map((p) => {
          const days = daysUntil(p.dueDate);
          const priority = priorityFromDays(days);
          return (
            <article
              key={p.id}
              className={cn(
                'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-lg',
                priorityCardClass(priority.color)
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => openPayment(p)} className="text-left">
                  <h3 className="text-lg font-bold text-content-primary">{p.customerName}</h3>
                  <p className="text-xs text-content-muted">{p.packageName}</p>
                </button>
                <StatusBadge status={p.status} />
              </div>

              <p className="mt-4 text-3xl font-black tracking-tight text-content-primary metric-tabular">
                {formatINRFull(p.pending)}
              </p>
              <p className="mt-1 text-sm text-content-secondary">Pending amount</p>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-white/40 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-black/20">
                <div>
                  <p className="text-[11px] text-content-muted">Due date</p>
                  <p className="text-sm font-semibold text-content-primary">{formatDate(p.dueDate)}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-bold',
                    priority.color === 'rose' && 'bg-rose-500 text-white',
                    priority.color === 'orange' && 'bg-orange-500 text-white',
                    priority.color === 'amber' && 'bg-amber-500 text-white',
                    priority.color === 'emerald' && 'bg-emerald-500 text-white',
                    priority.color === 'slate' && 'bg-slate-500 text-white'
                  )}
                >
                  {priority.label}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 bg-white/60 dark:bg-black/20">
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 bg-white/60 dark:bg-black/20 text-emerald-600">
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 bg-white/60 dark:bg-black/20">
                  <Bell className="h-3.5 w-3.5" /> Reminder
                </Button>
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white" onClick={() => openPayment(p)}>
                  <Banknote className="h-3.5 w-3.5" /> Collect
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
