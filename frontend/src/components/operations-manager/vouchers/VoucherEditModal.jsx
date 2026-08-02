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
    { key: 'amount', label: 'Hotel Price (₹)', type: 'number' },
    { key: 'advancePaid', label: 'Advance Paid (₹)', type: 'number' },
    { key: 'remainingBalance', label: 'Remaining Balance (₹)', type: 'number' },
  ],
  transport: [
    { key: 'vehicleDisplayName', label: 'Vehicle' },
    { key: 'driverName', label: 'Driver Name' },
    { key: 'driverPhone', label: 'Driver Phone' },
    { key: 'pickupLocation', label: 'Pickup' },
    { key: 'dropLocation', label: 'Drop' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
    { key: 'amount', label: 'Cab Price (₹)', type: 'number' },
    { key: 'advancePaid', label: 'Advance Paid (₹)', type: 'number' },
    { key: 'remainingBalance', label: 'Remaining Balance (₹)', type: 'number' },
  ],
  client: [
    { key: 'packageName', label: 'Package Name' },
    { key: 'pickup', label: 'Pickup' },
    { key: 'drop', label: 'Drop' },
  ],
};

function toMoneyInput(value) {
  if (value === '' || value == null) return '';
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '';
}

function resolveMoneyFields(payload = {}, assignment = {}) {
  const amount = payload.amount ?? assignment.amount ?? '';
  const advancePaid = payload.advancePaid ?? assignment.advancePaid ?? '';
  let remainingBalance = payload.remainingBalance ?? assignment.remainingBalance ?? '';
  if (
    (remainingBalance === '' || remainingBalance == null)
    && amount !== '' && amount != null
    && advancePaid !== '' && advancePaid != null
  ) {
    remainingBalance = Math.max(0, Number(amount) - Number(advancePaid));
  }
  return {
    amount: toMoneyInput(amount),
    advancePaid: toMoneyInput(advancePaid),
    remainingBalance: toMoneyInput(remainingBalance),
  };
}

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
  const supportsPayment = type === 'hotel' || type === 'transport';

  useEffect(() => {
    if (!open) return;
    const p = voucher?.payload || {};
    const next = {};
    fields.forEach(({ key }) => {
      next[key] = p[key] || booking?.[key] || '';
    });
    if (type === 'hotel') {
      const idx = Number(voucher?.assignmentIndex ?? 0);
      Object.assign(next, resolveMoneyFields(p, booking?.hotels?.[idx] || {}));
    }
    if (type === 'transport') {
      next.pickupLocation = p.pickupLocation || booking?.pickup || '';
      next.dropLocation = p.dropLocation || booking?.drop || '';
      const idx = Number(voucher?.assignmentIndex ?? 0);
      Object.assign(next, resolveMoneyFields(p, booking?.transport?.[idx] || {}));
    }
    if (type === 'client') {
      next.pickup = p.pickup || booking?.pickup || '';
      next.drop = p.drop || booking?.drop || '';
      next.packageName = p.packageName || booking?.packageName || '';
    }
    setForm(next);
  }, [open, voucher, booking, type]);

  const updateField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (supportsPayment && (key === 'amount' || key === 'advancePaid')) {
        const amount = Number(key === 'amount' ? value : next.amount);
        const advance = Number(key === 'advancePaid' ? value : next.advancePaid);
        if (Number.isFinite(amount) && Number.isFinite(advance) && value !== '') {
          next.remainingBalance = String(Math.max(0, amount - advance));
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!voucher?._id) return;
    setSaving(true);
    try {
      const parseMoney = (v) => (v === '' || v == null ? undefined : Number(v));
      const amountNum = parseMoney(form.amount);
      const advanceNum = parseMoney(form.advancePaid);
      const remainingNum = parseMoney(form.remainingBalance);
      const moneyPayload = {
        ...(amountNum != null && Number.isFinite(amountNum) ? { amount: amountNum } : {}),
        ...(supportsPayment && advanceNum != null && Number.isFinite(advanceNum) ? { advancePaid: advanceNum } : {}),
        ...(supportsPayment && remainingNum != null && Number.isFinite(remainingNum) ? { remainingBalance: remainingNum } : {}),
      };
      await API.put(`/operations-manager/vouchers/${voucher._id}`, {
        payload: { ...(voucher.payload || {}), ...form, ...moneyPayload },
      }, { skipSuccessToast: true });

      // Keep booking assignment money fields in sync when ops edits from voucher
      if (booking?._id) {
        const idx = Number(voucher.assignmentIndex ?? 0);
        const moneyPatch = {
          ...(amountNum != null && Number.isFinite(amountNum) ? { amount: amountNum } : {}),
          ...(advanceNum != null && Number.isFinite(advanceNum) ? { advancePaid: advanceNum } : {}),
          ...(remainingNum != null && Number.isFinite(remainingNum) ? { remainingBalance: remainingNum } : {}),
        };
        if (type === 'hotel' && Array.isArray(booking.hotels)) {
          const hotels = booking.hotels.map((h, i) => (
            i === idx ? { ...h, ...moneyPatch } : h
          ));
          await API.put(`/operations-manager/bookings/${booking._id}`, { hotels }, { skipSuccessToast: true }).catch(() => null);
        }
        if (type === 'transport' && Object.keys(moneyPatch).length && Array.isArray(booking.transport)) {
          const transport = booking.transport.map((t, i) => (
            i === idx ? { ...t, ...moneyPatch } : t
          ));
          await API.put(`/operations-manager/bookings/${booking._id}`, { transport }, { skipSuccessToast: true }).catch(() => null);
        }
      }

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
          {fields.map(({ key, label, type: inputType }) => (
            <label key={key} className="block">
              <span className="text-xs font-semibold text-content-muted">{label}</span>
              <input
                type={inputType === 'number' ? 'number' : 'text'}
                min={inputType === 'number' ? '0' : undefined}
                step={inputType === 'number' ? '1' : undefined}
                value={form[key] ?? ''}
                onChange={(e) => updateField(key, e.target.value)}
                className="input-premium mt-1 w-full"
              />
            </label>
          ))}
          {supportsPayment && (
            <p className="text-[11px] text-content-muted">
              Advance aur remaining balance voucher PDF pe dikhenge. Remaining amount/advance se auto calculate hota hai — zarurat ho to manually bhi edit kar sakte ho.
            </p>
          )}
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
