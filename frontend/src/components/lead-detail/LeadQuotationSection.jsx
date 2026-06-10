import { useRef, useState } from 'react';
import { Download, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import EmailActionButton from '../email/EmailActionButton';
import QuotationPdfOverlay from '../quotations/QuotationPdfOverlay';
import { formatINR } from '../quotations/quotationUtils';
import { resolveQuotationAmount } from './leadDetailData';

const statusConfig = {
  sent: { label: 'Sent', icon: Clock, class: 'text-amber-600 bg-amber-500/10' },
  approved: { label: 'Approved', icon: CheckCircle, class: 'text-emerald-600 bg-emerald-500/10' },
  pending_approval: { label: 'Pending', icon: Clock, class: 'text-amber-600 bg-amber-500/10' },
  rejected: { label: 'Rejected', icon: XCircle, class: 'text-red-600 bg-red-500/10' },
  draft: { label: 'Draft', icon: FileText, class: 'text-content-muted bg-surface-elevated' },
};

function canDownloadPdf(q) {
  return Boolean(q?._id && (q.pricing || q.packageSnapshot || q.package));
}

export default function LeadQuotationSection({
  quotations = [],
  lead = null,
  leadId = null,
  emailEndpoint = '/leads',
  onEmailSent,
}) {
  const [pdfQuote, setPdfQuote] = useState(null);
  const pdfRef = useRef(null);

  if (!quotations.length) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-subtle bg-surface-elevated/40">
          <h3 className="text-[15px] font-semibold text-content-primary">Quotations</h3>
          <p className="text-xs text-content-muted mt-0.5">Sent packages & proposals</p>
        </div>
        <p className="p-8 text-center text-sm text-content-muted">No quotations yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-subtle bg-surface-elevated/40">
          <h3 className="text-[15px] font-semibold text-content-primary">Quotations</h3>
          <p className="text-xs text-content-muted mt-0.5">Sent packages & proposals</p>
        </div>
        <div className="p-4 space-y-3">
          {quotations.map((q, index) => {
            const cfg = statusConfig[q.status] || statusConfig.draft;
            const Icon = cfg.icon;
            const amount = resolveQuotationAmount(q);
            const quoteNumber = q.quoteNumber || q.id || `Quote ${index + 1}`;
            const title = q.title || q.packageSnapshot?.name || q.package?.name || 'Package';
            const downloadable = canDownloadPdf(q);

            return (
              <div
                key={q._id || q.id || index}
                className="flex items-center gap-4 p-4 rounded-xl border border-subtle hover:border-brand-500/20 hover:bg-surface-elevated/30 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-content-primary">{quoteNumber}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.class}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-content-muted truncate mt-0.5">{title}</p>
                  <p className="text-sm font-bold text-content-primary metric-tabular mt-1">{formatINR(amount)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!downloadable}
                    onClick={() => downloadable && setPdfQuote(q)}
                    className="rounded-lg h-8 gap-1 text-sky-700 border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 dark:text-sky-400 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                  {lead && leadId && (
                    <EmailActionButton
                      lead={lead}
                      leadId={leadId}
                      emailEndpoint={emailEndpoint}
                      quotation={q}
                      defaultCategory="quotation"
                      onEmailSent={onEmailSent}
                      size="default"
                      label="Email"
                      showLabel
                      className="!h-8 !px-3 !text-xs"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <QuotationPdfOverlay
        quote={pdfQuote}
        open={!!pdfQuote}
        onClose={() => setPdfQuote(null)}
        pdfRef={pdfRef}
      />
    </>
  );
}
