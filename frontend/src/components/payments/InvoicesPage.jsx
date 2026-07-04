import {
  Download,
  Eye,
  FilePlus2,
  FileText,
  Mail,
  MessageCircle,
  Receipt,
  ScrollText,
} from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { StatusBadge } from './paymentsUi';
import { DEMO_INVOICES } from './paymentsDemoData';
import { formatINRFull } from './paymentsUtils';
import { cn } from '../../lib/utils';

const ACTIONS = [
  { label: 'Generate GST Invoice', icon: FileText, gradient: 'from-violet-500 to-indigo-600' },
  { label: 'Generate Proforma', icon: ScrollText, gradient: 'from-sky-500 to-blue-600' },
  { label: 'Generate Receipt', icon: Receipt, gradient: 'from-emerald-500 to-teal-600' },
  { label: 'Generate Credit Note', icon: FilePlus2, gradient: 'from-amber-500 to-orange-600' },
];

const STATUS_MAP = {
  open: { label: 'Open', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' },
  draft: { label: 'Draft', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25' },
  paid: { label: 'Paid', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25' },
  issued: { label: 'Issued', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25' },
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="GST invoices, proforma, receipts, and credit notes"
        breadcrumbs={['Payments', 'Invoices']}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className={cn(
              'flex items-center gap-3 rounded-2xl border border-subtle bg-surface p-4 text-left shadow-sm transition-all',
              'hover:-translate-y-0.5 hover:shadow-md'
            )}
          >
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow', a.gradient)}>
              <a.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-content-primary">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_INVOICES.map((inv) => (
          <article key={inv.id} className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{inv.type}</p>
                <h3 className="mt-0.5 text-lg font-bold text-content-primary">{inv.no}</h3>
                <p className="text-sm text-content-secondary">{inv.customer}</p>
              </div>
              <StatusBadge status={inv.status} map={STATUS_MAP} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-muted/40 px-3 py-2">
                <p className="text-[10px] text-content-muted">GSTIN</p>
                <p className="text-xs font-medium text-content-primary">{inv.gst}</p>
              </div>
              <div className="rounded-xl bg-surface-muted/40 px-3 py-2">
                <p className="text-[10px] text-content-muted">Amount</p>
                <p className="text-sm font-bold metric-tabular text-content-primary">{formatINRFull(inv.amount)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Preview PDF
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-emerald-600">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
