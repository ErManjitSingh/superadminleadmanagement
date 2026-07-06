import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { addBookingPayment, PAYMENT_MODES } from '../../services/bookingPaymentsApi';
import { openWhatsAppWithPdf } from '../../lib/shareWhatsAppPdf';

export default function AddBookingPaymentModal({ open, onClose, bookingId, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [sendReceipt, setSendReceipt] = useState(true);
  const [form, setForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    mode: 'upi',
    transactionId: '',
    referenceNumber: '',
    bankName: '',
    remarks: '',
    screenshotBase64: '',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('screenshotBase64', reader.result);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setForm({
      amount: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      mode: 'upi',
      transactionId: '',
      referenceNumber: '',
      bankName: '',
      remarks: '',
      screenshotBase64: '',
    });
    setSendReceipt(true);
  };

  const save = async (withReceipt) => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      const result = await addBookingPayment(bookingId, {
        ...form,
        amount: Number(form.amount),
        sendReceipt: withReceipt,
      });
      if (withReceipt && result?.delivery?.whatsapp?.waMeUrl) {
        await openWhatsAppWithPdf({
          waMeUrl: result.delivery.whatsapp.waMeUrl,
          pdfBase64: result.delivery.whatsapp.pdfBase64,
          fileName: result.delivery.whatsapp.fileName || 'receipt.pdf',
          message: result.delivery.whatsapp.message,
        });
      }
      onSuccess?.(result);
      reset();
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="2xl" lockDismiss={submitting}>
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-black text-content-primary mb-1">Add Payment</h2>
        <p className="text-sm text-content-muted mb-6">Record a payment installment for this booking.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Amount *</span>
            <input type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} className="input-premium mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Payment Date</span>
            <input type="date" value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} className="input-premium mt-1 w-full" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-content-muted">Payment Mode</span>
            <select value={form.mode} onChange={(e) => set('mode', e.target.value)} className="input-premium mt-1 w-full">
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Transaction ID</span>
            <input value={form.transactionId} onChange={(e) => set('transactionId', e.target.value)} className="input-premium mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Reference Number</span>
            <input value={form.referenceNumber} onChange={(e) => set('referenceNumber', e.target.value)} className="input-premium mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Bank Name</span>
            <input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} className="input-premium mt-1 w-full" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Remarks</span>
            <input value={form.remarks} onChange={(e) => set('remarks', e.target.value)} className="input-premium mt-1 w-full" />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-content-muted">Upload Screenshot</span>
            <label className={cn('mt-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-subtle cursor-pointer hover:bg-violet-50/50 text-sm w-fit')}>
              <Upload className="w-4 h-4" /> Choose file
              <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
            </label>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={submitting || !form.amount}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Payment'}
          </Button>
          <Button onClick={() => save(true)} disabled={submitting || !form.amount} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save & Send Receipt
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
