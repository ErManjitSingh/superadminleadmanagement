import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  FileText,
  IndianRupee,
  Users,
  CalendarClock,
  MapPin,
  Package,
  Inbox,
  Wallet,
  BadgeCheck,
  Clock3,
  Sparkles,
} from 'lucide-react';
import API from '../../api/axios';
import { unwrapList } from '../../utils/apiHelpers';
import { Button } from '../ui/button';
import Avatar from '../ui/Avatar';
import QuoteStatusBadge from './QuoteStatusBadge';
import QuotationFiltersPanel from './QuotationFiltersPanel';
import QuotationDetailDrawer from './QuotationDetailDrawer';
import QuotationPdfOverlay from './QuotationPdfOverlay';
import { formatINROrDash, getQuotationDisplayTotal } from './quotationUtils';
import {
  emptyQuotationFilters,
  countQuotationActiveFilters,
} from './quotationFilterUtils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useQuotationsQuery } from '../../features/quotations/hooks/useQuotationsQuery';
import { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { buildWhatsAppUrl } from '../../lib/whatsappContact';
import { cn } from '../../lib/utils';

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

function formatShortDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function relativeSent(value) {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return null;
}

function isSameDay(a, b = new Date()) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function ContactActions({ lead }) {
  const phone = lead?.phone;
  const whatsapp = lead?.whatsapp || lead?.phone;
  const email = lead?.email;

  if (!phone && !whatsapp && !email) {
    return <span className="text-xs text-content-muted">No contact</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors"
          title={`Call ${phone}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="w-3 h-3" />
          <span className="tabular-nums">{phone}</span>
        </a>
      )}
      {whatsapp && (
        <a
          href={buildWhatsAppUrl(whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500 text-white px-2.5 py-1 text-[11px] font-semibold shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 transition-colors"
          title={`WhatsApp ${whatsapp}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-3 h-3" />
          WhatsApp
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-violet-50 hover:text-violet-700 max-w-[190px]"
          title={email}
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{email}</span>
        </a>
      )}
    </div>
  );
}

function AdvanceVoucherBadge({ voucher }) {
  if (!voucher?.exists) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <Clock3 className="w-3 h-3" />
        No advance yet
      </span>
    );
  }

  if (voucher.sent) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-emerald-500/30">
        <BadgeCheck className="w-3.5 h-3.5" />
        Advance voucher sent
        {voucher.amount > 0 && (
          <span className="normal-case tracking-normal font-semibold opacity-95">
            · {formatINROrDash(voucher.amount)}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm shadow-amber-500/25">
      <Wallet className="w-3.5 h-3.5" />
      Advance received
      {voucher.amount > 0 && (
        <span className="normal-case tracking-normal font-semibold">
          · {formatINROrDash(voucher.amount)}
        </span>
      )}
      <span className="normal-case tracking-normal font-medium opacity-90">· voucher pending</span>
    </span>
  );
}

function SentRowSkeleton() {
  return (
    <div className="rounded-3xl border border-indigo-100 bg-white/70 p-5 animate-pulse shadow-sm">
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-200/80" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-48 rounded-full bg-slate-200/80" />
          <div className="h-3 w-72 rounded-full bg-slate-200/70" />
          <div className="h-8 w-56 rounded-full bg-slate-200/60" />
        </div>
        <div className="h-14 w-28 rounded-2xl bg-slate-200/80" />
      </div>
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
  const [voucherFilter, setVoucherFilter] = useState('all'); // all | sent | pending | none
  const pdfRef = useRef(null);
  const debouncedSearch = useDebouncedValue(appliedFilters.search, 350);

  const queryFilters = useMemo(
    () => ({
      ...appliedFilters,
      search: debouncedSearch,
      sentOnly: true,
      includeAdvanceVoucher: true,
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

  const filteredQuotes = useMemo(() => {
    if (voucherFilter === 'all') return quotes;
    return quotes.filter((q) => {
      const v = q.advanceVoucher;
      if (voucherFilter === 'sent') return !!v?.sent;
      if (voucherFilter === 'pending') return !!v?.exists && !v?.sent;
      if (voucherFilter === 'none') return !v?.exists;
      return true;
    });
  }, [quotes, voucherFilter]);

  const pageStats = useMemo(() => {
    const now = new Date();
    let pageValue = 0;
    let sentToday = 0;
    let voucherSent = 0;
    let advanceReceived = 0;
    const customers = new Set();

    for (const q of quotes) {
      pageValue += getQuotationDisplayTotal(q);
      if (q.lead?._id || q.lead?.name) customers.add(String(q.lead?._id || q.lead?.name));
      if (q.sentAt && isSameDay(new Date(q.sentAt), now)) sentToday += 1;
      if (q.advanceVoucher?.sent) voucherSent += 1;
      else if (q.advanceVoucher?.exists) advanceReceived += 1;
    }

    return { pageValue, sentToday, customers: customers.size, voucherSent, advanceReceived };
  }, [quotes]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['quotations'] });
  }, [queryClient]);

  useDataRefresh(['quotations', 'leads', 'bookings'], invalidate);

  useEffect(() => {
    if (!isAdmin) return;
    API.get('/leads/assignees', { skipSuccessToast: true, skipErrorToast: true })
      .then((res) => setExecutives(unwrapList(res.data)))
      .catch(() => setExecutives([]));
  }, [isAdmin]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [
    debouncedSearch,
    appliedFilters.destination,
    appliedFilters.dateFrom,
    appliedFilters.dateTo,
    appliedFilters.executiveId,
  ]);

  const creatorName = (q) => q.createdByExecutive?.name || q.createdBy?.name || '—';
  const hasActiveFilters = countQuotationActiveFilters(appliedFilters, { ignoreStatus: true }) > 0;

  const handlePrint = () => {
    setShowPdf(true);
    setAutoPrint(true);
  };

  const kpis = [
    {
      key: 'total',
      label: 'Quotations sent',
      value: total,
      icon: Send,
      ring: 'from-[#4f46e5] to-[#7c3aed]',
      chip: 'bg-indigo-500/15 text-indigo-700',
    },
    {
      key: 'value',
      label: 'Page quote value',
      value: formatINROrDash(pageStats.pageValue),
      icon: IndianRupee,
      ring: 'from-amber-500 to-orange-500',
      chip: 'bg-amber-500/15 text-amber-800',
    },
    {
      key: 'voucher',
      label: 'Advance voucher sent',
      value: pageStats.voucherSent,
      icon: BadgeCheck,
      ring: 'from-emerald-500 to-teal-500',
      chip: 'bg-emerald-500/15 text-emerald-800',
      hint: 'On this page',
    },
    {
      key: 'today',
      label: 'Sent today',
      value: pageStats.sentToday,
      icon: CalendarClock,
      ring: 'from-sky-500 to-cyan-500',
      chip: 'bg-sky-500/15 text-sky-800',
      hint: 'On this page',
    },
  ];

  const voucherTabs = [
    { id: 'all', label: 'All sent' },
    { id: 'sent', label: 'Voucher sent', count: pageStats.voucherSent },
    { id: 'pending', label: 'Advance pending voucher', count: pageStats.advanceReceived },
    { id: 'none', label: 'Quote only' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[28px] mb-6 text-white shadow-2xl shadow-indigo-500/25">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#6366f1_0%,_#7c3aed_45%,_#0ea5e9_100%)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                Quote desk · outbound
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Quotation Send
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed max-w-xl">
                Har bheji hui quotation — sahi price, customer contact, aur jinka{' '}
                <span className="font-semibold text-emerald-200">advance voucher</span> bhi chala gaya
                woh clearly highlight.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total sent</p>
                <p className="text-3xl font-black metric-tabular mt-1">{isLoading ? '—' : total}</p>
              </div>
              <div className="rounded-2xl bg-emerald-400/20 backdrop-blur-md border border-emerald-200/30 px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-emerald-100 font-semibold">
                  Voucher sent
                </p>
                <p className="text-3xl font-black metric-tabular mt-1 text-emerald-50">
                  {isLoading ? '—' : pageStats.voucherSent}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div
              key={k.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_10px_40px_-18px_rgba(79,70,229,0.45)]"
            >
              <div className={cn('absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20', k.ring)} />
              <div className="relative flex items-start justify-between gap-2 mb-3">
                <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl', k.chip)}>
                  <Icon className="w-4 h-4" />
                </span>
                {k.hint && <span className="text-[10px] font-medium text-slate-400">{k.hint}</span>}
              </div>
              <p className="relative text-2xl font-black metric-tabular text-slate-900 leading-none">
                {isLoading ? '—' : k.value}
              </p>
              <p className="relative text-xs font-semibold text-slate-500 mt-2">{k.label}</p>
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
        showStatusFilter={false}
        showExecutiveFilter={isAdmin}
        executives={executives}
        segmentLabel="Sent only"
        className="mb-4"
      />

      {/* Voucher quick filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {voucherTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setVoucherFilter(tab.id)}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all',
              voucherFilter === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                  voucherFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <>
            <SentRowSkeleton />
            <SentRowSkeleton />
            <SentRowSkeleton />
          </>
        ) : filteredQuotes.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-indigo-300/50 bg-gradient-to-b from-indigo-50/80 to-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {voucherFilter === 'all' ? 'No sent quotations yet' : 'No matches for this filter'}
            </h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              {voucherFilter === 'all'
                ? 'Jab quotation customer ko send hogi, yahan price, contact aur advance voucher status dikhega.'
                : 'Try another voucher filter or clear search.'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredQuotes.map((q, idx) => {
              const pkg =
                q.package?.name || q.packageSnapshot?.name || q.packageInfo?.packageName || 'Custom package';
              const amount = getQuotationDisplayTotal(q);
              const rel = relativeSent(q.sentAt);
              const sentBy = creatorName(q);
              const voucher = q.advanceVoucher;

              return (
                <motion.article
                  key={q._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.24) }}
                  onClick={() => setSelected(q)}
                  className={cn(
                    'group relative overflow-hidden rounded-[24px] border cursor-pointer transition-all duration-300',
                    'bg-gradient-to-br from-white via-white to-indigo-50/40',
                    'border-indigo-100/80 shadow-[0_12px_40px_-24px_rgba(67,56,202,0.55)]',
                    'hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-22px_rgba(67,56,202,0.55)] hover:border-indigo-300/70'
                  )}
                >
                  <div
                    className={cn(
                      'absolute left-0 top-0 bottom-0 w-1.5',
                      voucher?.sent
                        ? 'bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-600'
                        : voucher?.exists
                          ? 'bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600'
                          : 'bg-gradient-to-b from-indigo-400 via-violet-500 to-sky-500'
                    )}
                  />

                  <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                    <div className="flex flex-col gap-4">
                      {/* Top row */}
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <Avatar
                              name={q.lead?.name}
                              size="md"
                              className="!w-12 !h-12 !text-sm ring-4 ring-white shadow-md"
                            />
                            {voucher?.sent && (
                              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                                <BadgeCheck className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 truncate">
                                {q.lead?.name || 'Unknown customer'}
                              </h3>
                              <QuoteStatusBadge status={q.status} />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                              <span className="font-mono font-semibold text-indigo-600">
                                {q.quoteNumber}
                              </span>
                              {q.lead?.destination && (
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                  <MapPin className="w-3 h-3" />
                                  {q.lead.destination}
                                </span>
                              )}
                              {isAdmin && (
                                <span className="text-slate-400">by {sentBy}</span>
                              )}
                            </div>
                            <div className="mt-2.5">
                              <AdvanceVoucherBadge voucher={voucher} />
                              {voucher?.receiptNumber && (
                                <span className="ml-2 text-[11px] font-mono text-slate-400">
                                  {voucher.receiptNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price pill */}
                        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-[1px] shadow-lg shadow-orange-500/25 self-start">
                          <div className="rounded-[15px] bg-white/95 px-4 py-2.5 min-w-[130px]">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-700/70">
                              Quote price
                            </p>
                            <p className="text-xl font-black metric-tabular text-slate-900 leading-tight mt-0.5">
                              {formatINROrDash(amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Meta grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="rounded-2xl bg-white/80 border border-slate-100 px-3.5 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Contact
                          </p>
                          <ContactActions lead={q.lead} />
                        </div>

                        <div className="rounded-2xl bg-white/80 border border-slate-100 px-3.5 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Package
                          </p>
                          <p className="text-sm font-semibold text-slate-700 flex items-start gap-1.5">
                            <Package className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                            <span className="line-clamp-2">{pkg}</span>
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/80 border border-slate-100 px-3.5 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Quotation sent
                          </p>
                          <p className="text-sm font-bold text-slate-800">{rel || formatSentAt(q.sentAt)}</p>
                          {rel && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{formatSentAt(q.sentAt)}</p>
                          )}
                        </div>

                        <div className="rounded-2xl bg-white/80 border border-slate-100 px-3.5 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Advance
                          </p>
                          {voucher?.exists ? (
                            <>
                              <p className="text-sm font-bold text-emerald-700 metric-tabular">
                                {formatINROrDash(voucher.amount)}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {voucher.sent
                                  ? `Sent ${formatShortDate(voucher.whatsappSentAt || voucher.emailSentAt)}`
                                  : voucher.paymentDate
                                    ? `Paid ${formatShortDate(voucher.paymentDate)}`
                                    : 'Received'}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-medium text-slate-400">Not converted yet</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Users className="w-3.5 h-3.5" />
                          {pageStats.customers} customers on this page
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(q);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View quote
                          </Button>
                          <Button
                            size="sm"
                            className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(q);
                              setShowPdf(true);
                              setAutoPrint(true);
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {total > 0 && !isLoading && (
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-white px-4 py-3.5 shadow-sm">
          <p className="text-sm text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-800">
              {pagination.pageIndex * pagination.pageSize + 1}–
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, total)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{total}</span> sent quotations
            {voucherFilter !== 'all' && (
              <span className="text-indigo-600 font-medium"> · filtered view</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              disabled={pagination.pageIndex <= 0}
              onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-sm font-semibold text-slate-600 px-2 tabular-nums">
              {pagination.pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              disabled={pagination.pageIndex + 1 >= pageCount}
              onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

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
