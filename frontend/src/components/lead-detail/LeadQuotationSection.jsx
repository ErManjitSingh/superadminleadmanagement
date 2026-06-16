import { useRef, useState } from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import QuotationPdfOverlay from '../quotations/QuotationPdfOverlay';
import { formatINR } from '../quotations/quotationUtils';
import { resolveQuotationAmount } from './leadDetailData';
import { DETAIL_CARD } from './leadDetailUtils';
import { cn } from '../../lib/utils';

const statusConfig = {
  sent: { label: 'Sent', icon: Clock, class: 'text-amber-700 bg-amber-50 border-amber-100' },
  approved: { label: 'Approved', icon: CheckCircle, class: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  pending_approval: { label: 'Pending', icon: Clock, class: 'text-amber-700 bg-amber-50 border-amber-100' },
  rejected: { label: 'Rejected', icon: XCircle, class: 'text-red-700 bg-red-50 border-red-100' },
  draft: { label: 'Draft', icon: Clock, class: 'text-slate-600 bg-slate-50 border-slate-100' },
};

export default function LeadQuotationSection({ quotations = [], compact = false }) {
  const [pdfQuote, setPdfQuote] = useState(null);
  const pdfRef = useRef(null);

  if (!quotations.length) {
    return (
      <div className={`${DETAIL_CARD} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Quotations</h3>
        </div>
        <p className="p-8 text-center text-sm text-slate-400">No quotations yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${DETAIL_CARD} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Quotations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {['Quote #', 'Trip', 'Amount', 'Date', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {quotations.map((q, index) => {
                const cfg = statusConfig[q.status] || statusConfig.draft;
                const amount = resolveQuotationAmount(q);
                const quoteNumber = q.quoteNumber || q.id || `Q-${index + 1}`;
                const title = q.title || q.packageSnapshot?.name || q.package?.name || 'Package';
                const date = q.sentAt || q.createdAt;

                return (
                  <tr
                    key={q._id || q.id || index}
                    className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 cursor-pointer transition-colors"
                    onClick={() => setPdfQuote(q)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-violet-600">{quoteNumber}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">{title}</td>
                    <td className="px-5 py-3.5 font-bold tabular-nums text-slate-900 dark:text-white">{formatINR(amount)}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border', cfg.class)}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
