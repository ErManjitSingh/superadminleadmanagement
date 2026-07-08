import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { ACTIVITY_CONFIG, findQuotationForActivity } from './leadDetailData';
import QuotationPdfOverlay from '../quotations/QuotationPdfOverlay';
import { Button } from '../ui/button';
import { DETAIL_CARD } from './leadDetailUtils';

function formatActivityDate(iso) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

export default function LeadActivityTimeline({ activities, loading = false, quotations = [] }) {
  const [pdfQuote, setPdfQuote] = useState(null);
  const pdfRef = useRef(null);
  const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <>
      <div className={`${DETAIL_CARD} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Activity Timeline</h3>
        </div>
        <div className="p-5">
          {loading && (
            <p className="text-sm text-slate-400 text-center py-6">Loading timeline...</p>
          )}
          {!loading && sorted.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
          )}
          {!loading && sorted.length > 0 && (
            <div className="relative max-h-[26.5rem] overflow-y-auto overscroll-contain pr-1">
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-300 via-slate-200 to-transparent dark:from-violet-800 dark:via-slate-700" />
              <div className="space-y-1">
                {sorted.map((item, i) => {
                  const cfg = ACTIVITY_CONFIG[item.type] || ACTIVITY_CONFIG.status_changed;
                  const Icon = cfg.icon;
                  const { date, time } = formatActivityDate(item.date);
                  const quote = item.type?.startsWith('quotation_')
                    ? findQuotationForActivity(item, quotations)
                    : null;
                  const canDownload = Boolean(quote?._id && (quote.pricing || quote.packageSnapshot));

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="relative flex gap-4 py-3 group"
                    >
                      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pb-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title || cfg.label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <span className="font-medium text-slate-600 dark:text-slate-300">{item.user}</span>
                              {' · '}{date} at {time}
                            </p>
                          </div>
                          {canDownload && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPdfQuote(quote)}
                              className="rounded-lg h-7 gap-1 text-[11px] text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </Button>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
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
