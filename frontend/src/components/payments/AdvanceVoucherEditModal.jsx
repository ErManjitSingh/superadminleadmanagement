import { useEffect, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import API from '../../api/axios';
import { previewReceiptPdf } from '../../services/bookingPaymentsApi';
import { toast } from '../../context/ToastContext';

/**
 * Sales executive / ops can edit advance payment receipt customer phone then refresh PDF.
 */
export default function AdvanceVoucherEditModal({
  open,
  onClose,
  bookingId,
  payment,
  booking,
  onSaved,
}) {
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhone(booking?.customerPhone || payment?.customerPhone || '');
  }, [open, booking, payment]);

  const handleSave = async () => {
    if (!bookingId || !payment?._id) return;
    const trimmed = phone.trim();
    if (!trimmed) {
      toast.error('Phone number required');
      return;
    }
    setSaving(true);
    try {
      await API.patch(
        `/booking-payments/bookings/${bookingId}/contact`,
        { customerPhone: trimmed },
        { skipSuccessToast: true },
      );
      await previewReceiptPdf(bookingId, payment._id);
      toast.success('Advance voucher updated');
      onSaved?.({ customerPhone: trimmed });
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not update advance voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="md" lockDismiss={saving}>
      <div className="p-6">
        <h3 className="text-lg font-black text-content-primary flex items-center gap-2">
          <Pencil className="w-5 h-5 text-emerald-600" />
          Edit Advance Voucher
        </h3>
        <p className="text-sm text-content-muted mt-1 mb-4">
          Update phone shown on advance payment voucher ({payment?.receiptNumber || '—'})
        </p>
        <label className="block">
          <span className="text-xs font-semibold text-content-muted">Customer Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-premium mt-1 w-full"
            placeholder="+91 98765 43210"
          />
        </label>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & View PDF'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
