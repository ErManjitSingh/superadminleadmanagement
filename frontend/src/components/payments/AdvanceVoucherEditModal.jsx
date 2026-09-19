import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import {
  PAYMENT_MODES,
  updateAdvanceVoucher,
  previewReceiptPdf,
} from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Edit advance voucher details then regenerate PDF (hotel/cab voucher style).
 */
export default function AdvanceVoucherEditModal({
  open,
  onClose,
  bookingId,
  payment,
  booking,
  onSaved,
}) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      customerName: booking?.customerName || payment?.customerName || '',
      customerPhone: booking?.customerPhone || payment?.customerPhone || '',
      customerEmail: booking?.customerEmail || '',
      destination: booking?.destination || '',
      packageName: booking?.packageName || '',
      pickup: booking?.pickup || '',
      drop: booking?.drop || '',
      aadhaarNumber: booking?.aadhaarNumber || '',
      totalAmount: booking?.totalAmount != null ? String(booking.totalAmount) : '',
      amount: payment?.amount != null ? String(payment.amount) : '',
      mode: payment?.mode || 'upi',
      paymentDate: toDateInput(payment?.paymentDate || payment?.createdAt),
      transactionId: payment?.transactionId || payment?.referenceNumber || '',
      remarks: payment?.remarks || '',
    });
  }, [open, booking, payment]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!bookingId || !payment?._id) return;
    if (!String(form.customerName || '').trim()) {
      toast.error('Customer name required');
      return;
    }
    if (!String(form.customerPhone || '').trim()) {
      toast.error('Phone number required');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Advance amount required');
      return;
    }

    setSaving(true);
    try {
      const result = await updateAdvanceVoucher(bookingId, payment._id, {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: String(form.customerEmail || '').trim(),
        destination: String(form.destination || '').trim(),
        packageName: String(form.packageName || '').trim(),
        pickup: String(form.pickup || '').trim(),
        drop: String(form.drop || '').trim(),
        aadhaarNumber: String(form.aadhaarNumber || '').replace(/\D/g, ''),
        totalAmount: form.totalAmount === '' ? undefined : Number(form.totalAmount),
        amount: Number(form.amount),
        mode: form.mode,
        paymentDate: form.paymentDate || undefined,
        transactionId: String(form.transactionId || '').trim(),
        remarks: String(form.remarks || '').trim(),
      });
      await previewReceiptPdf(bookingId, payment._id);
      toast.success('Advance voucher regenerated');
      onSaved?.(result);
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not regenerate advance voucher');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'customerName', label: 'Customer Name', required: true },
    { key: 'customerPhone', label: 'Customer Phone', required: true },
    { key: 'customerEmail', label: 'Customer Email' },
    { key: 'destination', label: 'Destination' },
    { key: 'packageName', label: 'Package Name' },
    { key: 'pickup', label: 'Pickup' },
    { key: 'drop', label: 'Drop' },
    { key: 'aadhaarNumber', label: 'Aadhaar Number' },
    { key: 'totalAmount', label: 'Package Cost (₹)', type: 'number' },
    { key: 'amount', label: 'Advance Amount (₹)', type: 'number', required: true },
    { key: 'paymentDate', label: 'Payment Date', type: 'date' },
    { key: 'transactionId', label: 'Transaction / Reference ID' },
  ];

  return (
    <AppModal open={open} onClose={onClose} size="lg" lockDismiss={saving}>
      <div className="p-6">
        <h3 className="text-lg font-black text-content-primary flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-600" />
          Regenerate Advance Voucher
        </h3>
        <p className="text-sm text-content-muted mt-1 mb-4">
          Details edit karke naya PDF generate hoga ({payment?.receiptNumber || '—'})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {fields.map(({ key, label, type, required }) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold text-content-muted">
                {label}{required ? ' *' : ''}
              </span>
              <input
                type={type || 'text'}
                value={form[key] ?? ''}
                onChange={(e) => set(key, e.target.value)}
                className="input-premium mt-1 w-full"
              />
            </label>
          ))}

          <label className="block">
            <span className="text-xs font-semibold text-content-muted">Payment Mode *</span>
            <select
              value={form.mode || 'upi'}
              onChange={(e) => set('mode', e.target.value)}
              className="input-premium mt-1 w-full"
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-content-muted">Remarks</span>
            <textarea
              value={form.remarks || ''}
              onChange={(e) => set('remarks', e.target.value)}
              className="input-premium mt-1 w-full min-h-[72px]"
              rows={2}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Save & Regenerate
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
