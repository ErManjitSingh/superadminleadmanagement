import { useState } from 'react';
import { Button } from '../../ui/button';
import AppModal from '../../ui/AppModal';

export default function VoucherGenerateModal({ open, onClose, onGenerate, bookings = [] }) {
  const [form, setForm] = useState({ bookingId: '', type: 'hotel', title: '', validFrom: '', validUntil: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(form);
    setForm({ bookingId: '', type: 'hotel', title: '', validFrom: '', validUntil: '' });
  };

  const selected = bookings.find((b) => b._id === form.bookingId);

  return (
    <AppModal open={open} onClose={onClose} size="md" className="p-6">
      <h3 className="text-lg font-bold mb-4">Generate Voucher</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Booking</label>
          <select required value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} className="input-premium w-full mt-1">
            <option value="">Select booking…</option>
            {bookings.map((b) => (
              <option key={b._id} value={b._id}>{b.bookingNumber} — {b.customerName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Voucher Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-premium w-full mt-1">
            <option value="hotel">Hotel</option>
            <option value="cab">Cab / Transport</option>
            <option value="activity">Activity</option>
            <option value="master">Master Travel Voucher</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-premium w-full mt-1" placeholder={selected ? `${selected.destination} voucher` : 'Voucher title'} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-content-muted">Valid From</label>
            <input type="date" required value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} className="input-premium w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-content-muted">Valid Until</label>
            <input type="date" required value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="input-premium w-full mt-1" />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="teal">Generate</Button>
        </div>
      </form>
    </AppModal>
  );
}
