import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, ChevronLeft, ChevronRight, Phone, Mail, MessageCircle } from 'lucide-react';
import API from '../../api/axios';
import { unwrapList } from '../../utils/apiHelpers';
import { Button } from '../ui/button';
import Avatar from '../ui/Avatar';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuotationFiltersPanel from './QuotationFiltersPanel';
import QuotationDetailDrawer from './QuotationDetailDrawer';
import QuotationPdfOverlay from './QuotationPdfOverlay';
import { formatINR } from './quotationUtils';
import {
  emptyQuotationFilters,
  countQuotationActiveFilters,
} from './quotationFilterUtils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useQuotationsQuery } from '../../features/quotations/hooks/useQuotationsQuery';
import { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../hooks/useDataRefresh';

function formatSentAt(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ContactCell({ lead }) {
  const phone = lead?.phone || lead?.whatsapp;
  const whatsapp = lead?.whatsapp || lead?.phone;
  const email = lead?.email;

  if (!phone && !email) {
    return <span className="text-xs text-content-muted">—</span>;
  }

  return (
    <div className="space-y-1 min-w-[140px]">
      {phone && (
        <div className="flex items-center gap-1.5 text-xs text-content-secondary">
          <Phone className="w-3 h-3 shrink-0 text-content-muted" />
          <span className="font-medium tabular-nums">{phone}</span>
        </div>
      )}
      {whatsapp && whatsapp !== phone && (
        <div className="flex items-center gap-1.5 text-xs text-content-secondary">
          <MessageCircle className="w-3 h-3 shrink-0 text-emerald-600" />
          <span className="tabular-nums">{whatsapp}</span>
        </div>
      )}
      {email && (
        <div className="flex items-center gap-1.5 text-xs text-content-secondary">
          <Mail className="w-3 h-3 shrink-0 text-content-muted" />
          <span className="truncate max-w-[160px]" title={email}>{email}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Lists every quotation that has been sent to a customer (sentAt set).
 * @param {{ endpoint?: string }} props
 */
export default function QuotationSentPage({ endpoint = '/quotations' }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [executives, setExecutives] = useState([]);
  const [draftFilters, setDraftFilters] = useState(emptyQuotationFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyQuotationFilters);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [selected, setSelected] = useState(null);
  const [showPdf, setShowPdf] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const pdfRef = useRef(null);
  const debouncedSearch = useDebouncedValue(appliedFilters.search, 350);

  const queryFilters = useMemo(
    () => ({
      ...appliedFilters,
      search: debouncedSearch,
      sentOnly: true,
      status: undefined,
    }),
    [appliedFilters, debouncedSearch]
  );

  const { data, isLoading } = useQuotationsQuery({
    filters: queryFilters,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    endpoint,
  });

  const quotes = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
  }, [queryClient]);

  useDataRefresh(['quotations', 'leads'], invalidate);

  useEffect(() => {
    if (!isAdmin) return;
    API.get('/leads/assignees', { skipSuccessToast: true, skipErrorToast: true })
      .then((res) => setExecutives(unwrapList(res.data)))
      .catch(() => setExecutives([]));
  }, [isAdmin]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch, appliedFilters.destination, appliedFilters.dateFrom, appliedFilters.dateTo, appliedFilters.executiveId]);

  const creatorName = (q) =>
    q.createdByExecutive?.name || q.createdBy?.name || '—';

  const tableHeaders = isAdmin
    ? ['Quote #', 'Customer', 'Contact', 'Sent By', 'Package', 'Amount', 'Status', 'Sent At', 'Actions']
    : ['Quote #', 'Customer', 'Contact', 'Package', 'Amount', 'Status', 'Sent At', 'Actions'];

  const hasActiveFilters = countQuotationActiveFilters(appliedFilters, { ignoreStatus: true }) > 0;

  const handlePrint = () => {
    setShowPdf(true);
    setAutoPrint(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600">
              <Send className="w-4.5 h-4.5" />
            </span>
            <h1 className="text-2xl font-bold text-content-primary">Quotation Send</h1>
          </div>
          <p className="text-sm text-content-muted">
            All customers who have been sent a quotation — contact, package, amount and send date
          </p>
        </div>
        <div className="rounded-xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 px-4 py-3 min-w-[120px]">
          <p className="text-2xl font-black metric-tabular text-indigo-700">{total}</p>
          <p className="text-xs font-medium text-content-muted">Sent quotations</p>
        </div>
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
        showStatusFilter={false}
        showExecutiveFilter={isAdmin}
        executives={executives}
        className="mb-4"
      />

      <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-content-muted animate-pulse">Loading sent quotations...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-subtle bg-surface-elevated/50">
                    {tableHeaders.map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {quotes.length === 0 ? (
                    <tr>
                      <td colSpan={tableHeaders.length} className="p-12 text-center text-content-muted">
                        No quotations have been sent yet
                      </td>
                    </tr>
                  ) : (
                    quotes.map((q) => (
                      <tr key={q._id} className="hover:bg-indigo-500/[0.03] group">
                        <td className="px-4 py-3.5 font-mono text-sm font-medium text-sky-600 whitespace-nowrap">
                          {q.quoteNumber}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Avatar name={q.lead?.name} size="sm" className="!w-7 !h-7 !text-[10px]" />
                            <div>
                              <span className="text-sm font-medium block">{q.lead?.name || '—'}</span>
                              {q.lead?.destination && (
                                <span className="text-[11px] text-content-muted">{q.lead.destination}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <ContactCell lead={q.lead} />
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar name={creatorName(q)} size="sm" className="!w-7 !h-7 !text-[10px]" />
                              <span className="text-sm text-content-secondary">{creatorName(q)}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3.5 text-sm text-content-secondary whitespace-nowrap">
                          {q.package?.name || q.packageSnapshot?.name || q.packageInfo?.packageName || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold metric-tabular whitespace-nowrap">
                          {formatINR(q.pricing?.total)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <QuoteStatusBadge status={q.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-content-muted whitespace-nowrap">
                          {formatSentAt(q.sentAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            onClick={() => setSelected(q)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
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
                  of <span className="font-semibold text-content-primary">{total}</span> sent quotations
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.pageIndex <= 0}
                    onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <span className="text-sm font-medium text-content-secondary px-2 tabular-nums">
                    Page {pagination.pageIndex + 1} of {pageCount}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.pageIndex + 1 >= pageCount}
                    onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <QuotationDetailDrawer
        quote={selected}
        open={!!selected && !showPdf}
        onClose={() => {
          setSelected(null);
          setShowPdf(false);
        }}
        readOnly
        onDownloadPdf={handlePrint}
      />

      <QuotationPdfOverlay
        quote={selected}
        open={showPdf}
        onClose={() => {
          setShowPdf(false);
          setAutoPrint(false);
        }}
        pdfRef={pdfRef}
        autoPrint={autoPrint}
        onAutoPrintDone={() => setAutoPrint(false)}
      />
    </motion.div>
  );
}
