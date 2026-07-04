import {
  X,
  User,
  FileText,
  Receipt,
  RotateCcw,
  History,
  StickyNote,
  Phone,
  Mail,
} from 'lucide-react';
import AppDrawer from '../ui/AppDrawer';
import { Button } from '../ui/button';
import { PaymentProgressBar, StatusBadge } from './paymentsUi';
import { formatDate, formatINRFull, METHOD_LABELS } from './paymentsUtils';
import { usePaymentsUi } from './PaymentsContext';
import { cn } from '../../lib/utils';

export default function PaymentDetailDrawer() {
  const { selectedPayment: payment, closePayment } = usePaymentsUi();

  return (
    <AppDrawer open={!!payment} onClose={closePayment} className="max-w-lg">
      {payment && (
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-subtle bg-gradient-to-br from-violet-500/10 via-transparent to-transparent px-5 py-4">
            <div>
              <p className="text-xs font-medium text-content-muted">Payment details</p>
              <h2 className="mt-0.5 text-lg font-bold text-content-primary">{payment.customerName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={payment.status} />
                <span className="text-xs text-content-muted">{payment.invoiceNumber || payment.quoteNumber}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={closePayment}
              className="rounded-xl p-2 text-content-muted hover:bg-surface-muted hover:text-content-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <section className="rounded-2xl border border-subtle bg-surface-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content-primary">
                <User className="h-4 w-4 text-violet-500" /> Customer info
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Lead" value={payment.leadCode || payment.leadId} />
                <Info label="Quotation" value={payment.quoteNumber || payment.quotationId} />
                <Info label="Package" value={payment.packageName} />
                <Info label="Destination" value={payment.destination} />
                <Info label="Executive" value={payment.executive} />
                <Info label="Branch" value={payment.branch} />
              </dl>
              <div className="mt-3 flex gap-2">
                {payment.phone && (
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Call
                  </Button>
                )}
                {payment.email && (
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                )}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-content-primary">
                <FileText className="h-4 w-4 text-violet-500" /> Quotation summary
              </div>
              <div className="grid grid-cols-3 gap-2">
                <MiniStat label="Total" value={formatINRFull(payment.total)} />
                <MiniStat label="Received" value={formatINRFull(payment.received)} tone="emerald" />
                <MiniStat label="Pending" value={formatINRFull(payment.pending)} tone="amber" />
              </div>
              <PaymentProgressBar total={payment.total} received={payment.received} className="mt-3" />
            </section>

            <section>
              <div className="mb-3 text-sm font-semibold text-content-primary">Payment timeline</div>
              <ol className="space-y-3">
                {(payment.timeline || []).map((step, i) => (
                  <li key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'mt-1 h-2.5 w-2.5 rounded-full',
                          step.state === 'paid' && 'bg-emerald-500',
                          step.state === 'partial' && 'bg-sky-500',
                          step.state === 'pending' && 'bg-slate-300 dark:bg-slate-600'
                        )}
                      />
                      {i < (payment.timeline?.length || 0) - 1 && (
                        <span className="mt-1 w-px flex-1 bg-subtle" />
                      )}
                    </div>
                    <div className="flex-1 rounded-xl border border-subtle px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-content-primary">{step.label}</p>
                        <StatusBadge status={step.state === 'paid' ? 'completed' : step.state} />
                      </div>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {formatINRFull(step.paid)} / {formatINRFull(step.amount)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <ListBlock
              icon={Receipt}
              title="Invoices"
              items={(payment.invoices || []).map((inv) => `${inv.no} · ${inv.type} · ${formatINRFull(inv.amount)}`)}
              empty="No invoices yet"
            />
            <ListBlock
              icon={Receipt}
              title="Receipts"
              items={(payment.receipts || []).map((r) => `${r.no} · ${formatINRFull(r.amount)} · ${formatDate(r.date)}`)}
              empty="No receipts yet"
            />
            <ListBlock
              icon={RotateCcw}
              title="Refunds"
              items={(payment.refunds || []).map((r) => `${formatINRFull(r.amount)} · ${r.reason || 'Refund'}`)}
              empty="No refunds"
            />
            <ListBlock
              icon={History}
              title="Transaction history"
              items={(payment.transactions || []).map(
                (t) => `${formatINRFull(t.amount)} · ${METHOD_LABELS[t.method] || t.method} · ${t.ref || t.id}`
              )}
              empty="No transactions"
            />
            <ListBlock
              icon={StickyNote}
              title="Notes"
              items={payment.notes || []}
              empty="No notes"
            />
          </div>
        </div>
      )}
    </AppDrawer>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] text-content-muted">{label}</dt>
      <dd className="font-medium text-content-primary truncate">{value || '—'}</dd>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-content-primary';
  return (
    <div className="rounded-xl border border-subtle bg-surface px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-content-muted">{label}</p>
      <p className={cn('mt-0.5 text-sm font-bold metric-tabular', toneClass)}>{value}</p>
    </div>
  );
}

function ListBlock({ icon: Icon, title, items, empty }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-content-primary">
        <Icon className="h-4 w-4 text-violet-500" /> {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-content-muted">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="rounded-lg border border-subtle bg-surface-muted/30 px-3 py-2 text-xs text-content-secondary">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
