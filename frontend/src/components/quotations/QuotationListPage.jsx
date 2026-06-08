import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Download, Eye, FileText, Send, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import AppDrawer from '../ui/AppDrawer';
import Avatar from '../ui/Avatar';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuoteTimeline from './QuoteTimeline';
import QuotePricingPanel from './QuotePricingPanel';
import QuotePdfPreview from './QuotePdfPreview';
import QuotationFiltersPanel from './QuotationFiltersPanel';
import { QUOTE_STATUSES } from './constants';
import { formatINR } from './quotationUtils';
import {
  emptyQuotationFilters,
  countQuotationActiveFilters,
} from './quotationFilterUtils';
import { cn } from '../../lib/utils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useQuotationsQuery, useQuotationStatsQuery } from '../../features/quotations/hooks/useQuotationsQuery';
import { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';

const KPI = [
  { key: 'total', label: 'Total Quotes', color: 'from-sky-500/20 to-blue-500/10 border-sky-400/40', icon: FileText, text: 'text-sky-700' },
  { key: 'sent', label: 'Sent', color: 'from-indigo-500/20 to-violet-500/10 border-indigo-400/40', icon: Send, text: 'text-indigo-700' },
  { key: 'approved', label: 'Approved', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/40', icon: TrendingUp, text: 'text-emerald-700' },
  { key: 'value', label: 'Pipeline Value', color: 'from-amber-500/20 to-orange-500/10 border-amber-400/40', icon: TrendingUp, text: 'text-amber-700' },
];

const STATUS_OPTIONS = [{ value: '', label: 'All Statuses' }, ...QUOTE_STATUSES.map((s) => ({ value: s.value, label: s.label }))];

export default function QuotationListPage() {
  const queryClient = useQueryClient();
  const [draftFilters, setDraftFilters] = useState(emptyQuotationFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyQuotationFilters);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [selected, setSelected] = useState(null);
  const [showPdf, setShowPdf] = useState(false);
  const pdfRef = useRef(null);
  const [searchParams] = useSearchParams();
  const debouncedSearch = useDebouncedValue(appliedFilters.search, 350);

  const queryFilters = useMemo(
    () => ({ ...appliedFilters, search: debouncedSearch }),
    [appliedFilters, debouncedSearch]
  );

  const { data, isLoading } = useQuotationsQuery({
    filters: queryFilters,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const { data: statsData } = useQuotationStatsQuery();

  const quotes = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
  }, [queryClient]);

  useDataRefresh(['quotations', 'leads'], invalidate);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch, appliedFilters.status, appliedFilters.destination, appliedFilters.dateFrom, appliedFilters.dateTo]);

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && quotes.length) {
      const q = quotes.find((x) => x._id === viewId);
      if (q) setSelected(q);
    }
  }, [searchParams, quotes]);

  const kpis = statsData ?? {
    total: total,
    sent: 0,
    approved: 0,
    value: 0,
  };

  useEffect(() => {
    if (!showPdf) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [showPdf]);

  const handlePrint = () => {
    setShowPdf(true);
    setTimeout(() => { window.print(); }, 300);
  };

  const updateStatus = async (id, status) => {
    const timelineEntry = { type: status, date: new Date().toISOString(), user: 'You', notes: `Status updated to ${status}` };
    const q = quotes.find((x) => x._id === id);
    await API.put(`/quotations/${id}`, { status, timeline: [...(q?.timeline || []), timelineEntry] });
    invalidate();
    if (selected?._id === id) setSelected(null);
  };

  const hasActiveFilters = countQuotationActiveFilters(appliedFilters) > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Quotations</h1>
          <p className="text-sm text-content-muted">Create, track & convert travel quotes</p>
        </div>
        <Link to="/quotations/new">
          <Button className="rounded-xl gap-2" variant="sky"><Plus className="w-4 h-4" /> New Quotation</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {KPI.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn('rounded-2xl border bg-gradient-to-br p-4', k.color)}>
              <Icon className={cn('w-5 h-5 mb-2', k.text)} />
              <p className={cn('text-2xl font-black metric-tabular', k.text)}>{k.key === 'value' ? formatINR(kpis.value) : kpis[k.key]}</p>
              <p className="text-xs font-medium text-content-muted mt-1">{k.label}</p>
            </motion.div>
          );
        })}
      </div>

      <QuotationFiltersPanel
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters({ ...draftFilters })}
        onClear={() => {
          setDraftFilters(emptyQuotationFilters);
          setAppliedFilters(emptyQuotationFilters);
        }}
        onRefresh={invalidate}
        hasActiveFilters={hasActiveFilters}
        showStatusFilter
        statusOptions={STATUS_OPTIONS}
        className="mb-4"
      />

      <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-muted animate-pulse">Loading quotations...</div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-subtle bg-surface-elevated/50">
                {['Quote #', 'Customer', 'Package', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-subtle">
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-content-muted">
                      No quotations match your filters
                    </td>
                  </tr>
                ) : quotes.map((q) => (
                  <tr key={q._id} className="hover:bg-sky-500/[0.03] cursor-pointer group" onClick={() => setSelected(q)}>
                    <td className="px-4 py-3.5 font-mono text-sm font-medium text-sky-600">{q.quoteNumber}</td>
                    <td className="px-4 py-3.5"><div className="flex items-center gap-2"><Avatar name={q.lead?.name} size="sm" className="!w-7 !h-7 !text-[10px]" /><span className="text-sm font-medium">{q.lead?.name}</span></div></td>
                    <td className="px-4 py-3.5 text-sm text-content-secondary">{q.package?.name}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold metric-tabular">{formatINR(q.pricing?.total)}</td>
                    <td className="px-4 py-3.5"><QuoteStatusBadge status={q.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-content-muted">{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => { setSelected(q); setShowPdf(true); }} className="p-1.5 rounded-lg hover:bg-sky-500/10 text-sky-600" title="Preview PDF"><Eye className="w-3.5 h-3.5" /></button>
                        {q.status === 'draft' && <button type="button" onClick={() => updateStatus(q._id, 'sent')} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600" title="Mark Sent"><Send className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-t border-subtle bg-surface-elevated/30">
              <p className="text-sm text-content-muted">
                Showing{' '}
                <span className="font-semibold text-content-primary">
                  {pagination.pageIndex * pagination.pageSize + 1}–
                  {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)}
                </span>{' '}
                of <span className="font-semibold text-content-primary">{total}</span> quotations
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" disabled={pagination.pageIndex <= 0} onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <span className="text-sm font-medium text-content-secondary px-2 tabular-nums">
                  Page {pagination.pageIndex + 1} of {pageCount}
                </span>
                <Button variant="secondary" size="sm" disabled={pagination.pageIndex + 1 >= pageCount} onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      <AppDrawer
        open={!!selected && !showPdf}
        onClose={() => { setSelected(null); setShowPdf(false); }}
        className="max-w-lg overflow-y-auto"
      >
        {selected && (
          <>
            <div className="p-5 border-b border-subtle bg-gradient-to-r from-sky-500/10 to-indigo-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sky-600 font-bold">{selected.quoteNumber}</p>
                  <h3 className="text-lg font-bold">{selected.lead?.name}</h3>
                </div>
                <QuoteStatusBadge status={selected.status} />
              </div>
            </div>
            <div className="p-5 space-y-5">
              <QuotePricingPanel pricing={selected.pricing} readOnly />
              <QuoteTimeline timeline={selected.timeline} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handlePrint} variant="sky" className="rounded-xl gap-2 flex-1"><Download className="w-4 h-4" /> Download PDF</Button>
                {selected.status === 'sent' && <Button variant="outline" onClick={() => updateStatus(selected._id, 'approved')} className="rounded-xl flex-1 text-emerald-700 border-emerald-500/40 bg-emerald-500/10">Approve</Button>}
                {selected.status === 'sent' && <Button variant="outline" onClick={() => updateStatus(selected._id, 'rejected')} className="rounded-xl flex-1 text-red-700 border-red-500/40 bg-red-500/10">Reject</Button>}
              </div>
            </div>
          </>
        )}
      </AppDrawer>

      {showPdf && selected && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[210] bg-white overflow-y-auto print:static print:inset-auto">
          <div className="sticky top-0 bg-surface border-b border-subtle p-3 flex justify-between print:hidden">
            <Button variant="outline" onClick={() => setShowPdf(false)} className="rounded-xl">Close</Button>
            <Button onClick={() => window.print()} className="rounded-xl gap-2 bg-sky-600"><Download className="w-4 h-4" /> Print / Save PDF</Button>
          </div>
          <QuotePdfPreview ref={pdfRef} quote={selected} />
        </div>,
        document.body,
      )}
    </motion.div>
  );
}
