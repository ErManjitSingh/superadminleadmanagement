import { useEffect, useState } from 'react';
import { Download, Eye, Send, Loader2, Plus, IndianRupee, Bell } from 'lucide-react';
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

const MODE_LABELS = {
  cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card', debit_card: 'Debit Card', cheque: 'Cheque',
};

export default function BookingPaymentsPanel({ bookingId, onUpdated }) {
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

  const handleResend = async (paymentId) => {
    setResending(paymentId);
    try {
      await resendPaymentReceipt(bookingId, paymentId);
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

  if (loading && !data) {
    return <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  const { payments = [], timeline = [], summary } = data || {};

  return (
    <div className="space-y-6">
      <PaymentSummaryCard summary={summary} />

      <div className="flex flex-wrap gap-2">
        {canAddPayment && summary?.paymentStatus !== 'paid' && (
          <Button onClick={() => setAddOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add Payment
          </Button>
        )}
        {canSendReminder && summary?.remainingBalance > 0 && summary?.paymentStatus !== 'paid' && (
          <Button
            variant="outline"
            onClick={handleSendReminder}
            disabled={sendingReminder}
            className="border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold"
          >
            {sendingReminder ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Send Payment Reminder
          </Button>
        )}
      </div>

      {isSalesExec && (
        <p className="text-xs text-content-muted rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 p-3">
          Sales executives can only collect the first advance payment during lead conversion. Remaining payments are handled by Operations.
        </p>
      )}

      {payments.length > 0 && (
        <div className="rounded-2xl border border-subtle bg-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-subtle flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-content-primary">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-content-muted border-b border-subtle">
                  <th className="px-5 py-3">Receipt</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">By</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-subtle/50 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-semibold">{p.receiptNumber}</td>
                    <td className="px-5 py-3 font-bold text-emerald-600 tabular-nums">{formatINR(p.amount)}</td>
                    <td className="px-5 py-3 capitalize">{MODE_LABELS[p.mode] || p.mode}</td>
                    <td className="px-5 py-3 text-content-muted">{formatDate(p.paymentDate || p.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs">{p.createdByName || p.createdBy?.name || '—'}</span>
                      {p.isFirstAdvance && (
                        <span className="ml-1 text-[10px] font-bold uppercase text-violet-600">Advance</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => previewReceiptPdf(bookingId, p._id)}
                          className={cn('p-2 rounded-lg hover:bg-violet-100 text-violet-600 transition-colors')}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadReceiptPdf(bookingId, p._id, p.receiptFileName || `${p.receiptNumber}.pdf`)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-content-secondary transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResend(p._id)}
                          disabled={resending === p._id}
                          className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                          title="Resend"
                        >
                          {resending === p._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-content-primary mb-4">Payment Timeline</h3>
        <PaymentTimeline events={timeline} loading={loading} />
      </div>

      <AddBookingPaymentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        bookingId={bookingId}
        onSuccess={handlePaymentAdded}
      />
    </div>
  );
}
