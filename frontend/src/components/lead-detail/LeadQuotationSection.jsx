import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';

const statusConfig = {
  sent: { label: 'Sent', icon: Clock, class: 'text-amber-600 bg-amber-500/10' },
  approved: { label: 'Approved', icon: CheckCircle, class: 'text-emerald-600 bg-emerald-500/10' },
  rejected: { label: 'Rejected', icon: XCircle, class: 'text-red-600 bg-red-500/10' },
  draft: { label: 'Draft', icon: FileText, class: 'text-content-muted bg-surface-elevated' },
};

export default function LeadQuotationSection({ quotations }) {
  return (
    <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-subtle bg-surface-elevated/40">
        <h3 className="text-[15px] font-semibold text-content-primary">Quotations</h3>
        <p className="text-xs text-content-muted mt-0.5">Sent packages & proposals</p>
      </div>
      <div className="p-4 space-y-3">
        {quotations.map((q) => {
          const cfg = statusConfig[q.status] || statusConfig.draft;
          const Icon = cfg.icon;
          return (
            <div key={q.id} className="flex items-center gap-4 p-4 rounded-xl border border-subtle hover:border-brand-500/20 hover:bg-surface-elevated/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-content-primary">{q.id}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.class}`}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-content-muted truncate mt-0.5">{q.title}</p>
                <p className="text-sm font-bold text-content-primary metric-tabular mt-1">₹{q.amount?.toLocaleString('en-IN')}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-8 gap-1 shrink-0 text-sky-700 border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 dark:text-sky-400"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
