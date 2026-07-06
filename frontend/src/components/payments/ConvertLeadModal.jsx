import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Upload, IndianRupee, Calendar, CreditCard } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { getConvertPreview, convertLeadWithPayment, PAYMENT_MODES } from '../../services/bookingPaymentsApi';
import { formatINR } from '../operations-manager/operationsUtils';

function formatDateInput(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function formatTravelDates(start, end) {
  if (!start) return '—';
  const fmt = (x) => new Date(x).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return end ? `${fmt(start)} — ${fmt(end)}` : fmt(start);
}

export default function ConvertLeadModal({ open, onClose, leadId, onSuccess }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (!open || !leadId) return;
    setLoading(true);
    getConvertPreview(leadId)
      .then((data) => {
        setPreview(data);
        if (data.totalPackageCost > 0) {
          setForm((f) => ({ ...f, amount: String(Math.round(data.totalPackageCost * 0.3)) }));
        }
      })
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [open, leadId]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set('screenshotBase64', reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      const result = await convertLeadWithPayment(leadId, {
        ...form,
        amount: Number(form.amount),
      });
      onSuccess?.(result);
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="3xl" lockDismiss={submitting}>
      <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-1">Lead Conversion</p>
          <h2 className="text-2xl font-black text-content-primary tracking-tight">Convert Lead Into Booking</h2>
          <p className="text-sm text-content-muted mt-1">Record the first advance payment to create the booking.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : preview ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent backdrop-blur-xl p-5 shadow-inner">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['Customer Name', preview.customerName],
                  ['Lead ID', preview.leadNumber?.slice?.(-8) || leadId?.slice?.(-8)],
                  ['Package Name', preview.packageName || '—'],
                  ['Destination', preview.destination],
                  ['Travel Dates', formatTravelDates(preview.travelDate, preview.returnDate)],
                  ['Travellers', preview.travellers],
                  ['Total Package Cost', formatINR(preview.totalPackageCost)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">{label}</p>
                    <p className="font-bold text-content-primary mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-md p-5 space-y-4">
              <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" /> First Advance Payment
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-content-muted">Advance Amount *</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.amount}
                    onChange={(e) => set('amount', e.target.value)}
                    className="input-premium mt-1 w-full"
                    placeholder="Enter amount"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-content-muted flex items-center gap-1"><Calendar className="w-3 h-3" /> Payment Date</span>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => set('paymentDate', e.target.value)}
                    className="input-premium mt-1 w-full"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-content-muted flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment Mode</span>
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
                  <span className="text-xs font-semibold text-content-muted">Upload Payment Screenshot (Optional)</span>
                  <div className="mt-1 flex items-center gap-3">
                    <label className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-subtle cursor-pointer hover:bg-violet-50/50 transition-colors text-sm font-medium text-content-secondary'
                    )}>
                      <Upload className="w-4 h-4" /> Choose file
                      <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />
                    </label>
                    {form.screenshotBase64 && <span className="text-xs text-emerald-600 font-semibold">Screenshot attached</span>}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.amount || Number(form.amount) <= 0}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</> : 'Receive Payment & Convert Booking'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-content-muted py-12">Unable to load lead details.</p>
        )}
      </div>
    </AppModal>
  );
}
