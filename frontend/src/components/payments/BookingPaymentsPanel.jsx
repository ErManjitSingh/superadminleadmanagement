import { useEffect, useState } from 'react';
import {
  Download, Eye, Loader2, Plus, IndianRupee, Bell, Mail, FileText, StickyNote, MessageCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { formatINR, formatDate } from '../operations-manager/operationsUtils';
import PaymentSummaryCard from './PaymentSummaryCard';
import PaymentTimeline from './PaymentTimeline';
import AddBookingPaymentModal from './AddBookingPaymentModal';
import {
  getBookingPayments,
  downloadReceiptPdf,
  previewReceiptPdf,
  resendPaymentReceipt,
  sendPaymentReminder,
} from '../../services/bookingPaymentsApi';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../hooks/useDataRefresh';

const MODE_LABELS = {
  cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card', debit_card: 'Debit Card', cheque: 'Cheque',
  net_banking: 'Net Banking', card: 'Card',
};

const HISTORY_VISIBLE = 6;

export default function BookingPaymentsPanel({
  bookingId,
  onUpdated,
  variant = 'full',
  summary: summaryProp,
}) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resending, setResending] = useState(null);
  const [sendingReminder, setSendingReminder] = useState(false);

  const canAddPayment = ['operations_manager', 'admin', 'accountant'].includes(user?.role);
  const canSendReminder = ['operations_manager', 'admin'].includes(user?.role);
  const isSalesExec = user?.role === 'sales_executive';

  const load = () => {
    if (!bookingId) return;
    setLoading(true);
    getBookingPayments(bookingId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [bookingId]);

  useDataRefresh(['operations', `booking:${bookingId}`], () => load());

  const handleResend = async (paymentId, channel = 'both') => {
    setResending(`${paymentId}-${channel}`);
    try {
      await resendPaymentReceipt(bookingId, paymentId, channel);
    } finally {
      setResending(null);
    }
  };

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const result = await sendPaymentReminder(bookingId);
      if (result?.results?.waMeUrl) {
        window.open(result.results.waMeUrl, '_blank', 'noopener,noreferrer');
      }
      load();
    } finally {
      setSendingReminder(false);
    }
  };

  const handlePaymentAdded = (result) => {
    load();
    onUpdated?.(result?.booking);
  };

  if (loading && !data && variant !== 'sidebar') {
    return <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  const { payments = [], timeline = [], summary: fetchedSummary } = data || {};
  const summary = summaryProp || fetchedSummary;

  if (variant === 'sidebar') {
    return (
      <div className="space-y-4">
        <PaymentSummaryCard summary={summary} />
        {canAddPayment && summary?.paymentStatus !== 'paid' && (
          <Button
            onClick={() => setAddOpen(true)}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold h-11 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Payment
          </Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          {canSendReminder && summary?.remainingBalance > 0 && summary?.paymentStatus !== 'paid' && (
            <QuickBtn
              icon={Bell}
              label="Send Reminder"
              loading={sendingReminder}
              onClick={handleSendReminder}
            />
          )}
          <QuickBtn icon={Mail} label="Send Email" onClick={handleSendReminder} />
          <QuickBtn icon={FileText} label="Generate Invoice" disabled />
          <QuickBtn icon={StickyNote} label="Add Note" disabled />
        </div>
        {isSalesExec && (
          <p className="text-[11px] text-content-muted rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 p-3">
            Sales executives collect only the first advance during lead conversion.
          </p>
        )}
        <AddBookingPaymentModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          bookingId={bookingId}
          onSuccess={handlePaymentAdded}
        />
      </div>
    );
  }

  const historyBlock = payments.length > 0 && variant !== 'sidebar' && (
    <div className="rounded-2xl border border-subtle bg-surface overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-violet-600" />
          <h3 className="text-sm font-bold text-content-primary">Payment History</h3>
        </div>
        {payments.length > HISTORY_VISIBLE && (
          <span className="text-[11px] text-content-muted">{payments.length} records · scroll</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className={cn('overflow-y-auto scrollbar-thin', payments.length > HISTORY_VISIBLE && 'max-h-[21rem]')}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-content-muted border-b border-subtle bg-surface-muted/30">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Receipt No</th>
                <th className="px-5 py-3">Payment Mode</th>
                <th className="px-5 py-3">Transaction ID</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Received By</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b border-subtle/50 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                  <td className="px-5 py-3 text-content-muted whitespace-nowrap">{formatDate(p.paymentDate || p.createdAt)}</td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold">{p.receiptNumber}</td>
                  <td className="px-5 py-3 capitalize">{MODE_LABELS[p.mode] || p.mode}</td>
                  <td className="px-5 py-3 text-xs text-content-muted">{p.transactionId || p.referenceNumber || '—'}</td>
                  <td className="px-5 py-3 font-bold text-emerald-600 tabular-nums whitespace-nowrap">{formatINR(p.amount)}</td>
                  <td className="px-5 py-3 text-xs">{p.createdByName || p.createdBy?.name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Completed</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => previewReceiptPdf(bookingId, p._id)} className="p-2 rounded-lg hover:bg-violet-100 text-violet-600" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => downloadReceiptPdf(bookingId, p._id, p.receiptFileName || `${p.receiptNumber}.pdf`)} className="p-2 rounded-lg hover:bg-slate-100 text-content-secondary" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleResend(p._id, 'whatsapp')} disabled={resending === `${p._id}-whatsapp`} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600" title="Send WhatsApp">
                        {resending === `${p._id}-whatsapp` ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => handleResend(p._id, 'email')} disabled={resending === `${p._id}-email`} className="p-2 rounded-lg hover:bg-violet-100 text-violet-600" title="Send Email">
                        {resending === `${p._id}-email` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length > HISTORY_VISIBLE && (
          <p className="py-3 text-center text-[11px] font-medium text-violet-600 border-t border-subtle">View All Payments — scroll above</p>
        )}
      </div>
    </div>
  );

  if (variant === 'history') {
    return historyBlock;
  }

  return (
    <div className="space-y-6">
      {variant === 'full' && <PaymentSummaryCard summary={summary} />}

      {variant === 'full' && (
        <div className="flex flex-wrap gap-2">
          {canAddPayment && summary?.paymentStatus !== 'paid' && (
            <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Payment
            </Button>
          )}
          {canSendReminder && summary?.remainingBalance > 0 && summary?.paymentStatus !== 'paid' && (
            <Button variant="outline" onClick={handleSendReminder} disabled={sendingReminder} className="border-amber-300 text-amber-700">
              {sendingReminder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
              Send Payment Reminder
            </Button>
          )}
        </div>
      )}

      {historyBlock}

      {variant === 'full' && (
        <div>
          <h3 className="text-sm font-bold text-content-primary mb-4">Payment Timeline</h3>
          <PaymentTimeline events={timeline} loading={loading} />
        </div>
      )}

      <AddBookingPaymentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        bookingId={bookingId}
        onSuccess={handlePaymentAdded}
      />
    </div>
  );
}

function QuickBtn({ icon: Icon, label, onClick, loading, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-subtle bg-surface-muted/40 p-3 text-center hover:bg-violet-50/50 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-violet-600" /> : <Icon className="w-4 h-4 text-violet-600" />}
      <span className="text-[10px] font-semibold text-content-secondary leading-tight">{label}</span>
    </button>
  );
}
