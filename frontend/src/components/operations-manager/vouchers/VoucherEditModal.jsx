import { useEffect, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import AppModal from '../../ui/AppModal';
import { Button } from '../../ui/button';
import API from '../../../api/axios';
import { regenerateVoucher, previewVoucherPdf } from '../../../services/operationsVoucherApi';
import { toast } from '../../../context/ToastContext';

const FIELD_SETS = {
  hotel: [
    { key: 'hotelName', label: 'Hotel Name' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'mealPlan', label: 'Meal Plan' },
    { key: 'address', label: 'Address' },
    { key: 'hotelPhone', label: 'Hotel Phone' },
  ],
  transport: [
    { key: 'vehicleDisplayName', label: 'Vehicle' },
    { key: 'driverName', label: 'Driver Name' },
    { key: 'driverPhone', label: 'Driver Phone' },
    { key: 'pickupLocation', label: 'Pickup' },
    { key: 'dropLocation', label: 'Drop' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
  ],
  client: [
    { key: 'packageName', label: 'Package Name' },
    { key: 'pickup', label: 'Pickup' },
    { key: 'drop', label: 'Drop' },
  ],
};

export default function VoucherEditModal({
  open,
  onClose,
  type,
  voucher,
  booking,
  onSaved,
}) {
  const fields = FIELD_SETS[type] || FIELD_SETS.transport;
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const p = voucher?.payload || {};
    const next = {};
    fields.forEach(({ key }) => {
      next[key] = p[key] || booking?.[key] || '';
    });
    if (type === 'transport') {
      next.pickupLocation = p.pickupLocation || booking?.pickup || '';
      next.dropLocation = p.dropLocation || booking?.drop || '';
    }
    if (type === 'client') {
      next.pickup = p.pickup || booking?.pickup || '';
      next.drop = p.drop || booking?.drop || '';
      next.packageName = p.packageName || booking?.packageName || '';
    }
    setForm(next);
  }, [open, voucher, booking, type]);

  const handleSave = async () => {
    if (!voucher?._id) return;
    setSaving(true);
    try {
      await API.put(`/operations-manager/vouchers/${voucher._id}`, {
        payload: { ...(voucher.payload || {}), ...form },
      }, { skipSuccessToast: true });
      const updated = await regenerateVoucher(voucher._id);
      toast.success('Voucher updated');
      onSaved?.(updated);
      try {
        await previewVoucherPdf(updated._id || voucher._id);
      } catch {
        /* optional */
      }
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not update voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="md" lockDismiss={saving}>
      <div className="p-6">
        <h3 className="text-lg font-black text-content-primary flex items-center gap-2">
          <Pencil className="w-5 h-5 text-violet-600" />
          Edit Voucher
        </h3>
        <p className="text-sm text-content-muted mt-1 mb-4">
          Update details and regenerate PDF for {voucher?.voucherNumber || 'this voucher'}
        </p>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {fields.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold text-content-muted">{label}</span>
              <input
                value={form[key] || ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="input-premium mt-1 w-full"
              />
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Regenerate'}
          </Button>
        </div>
      </div>
    </AppModal>
  );
}
