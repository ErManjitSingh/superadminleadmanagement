import { useState } from 'react';
import { Button } from '../../ui/button';
import AppModal from '../../ui/AppModal';
import { VENDOR_TYPES } from '../constants';

export default function VendorFormModal({ open, onClose, onSave, vendor }) {
  const [form, setForm] = useState({
    name: vendor?.name || '',
    type: vendor?.type || 'hotel',
    contact: vendor?.contact || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    destinations: vendor?.destinations?.join(', ') || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      destinations: form.destinations.split(',').map((s) => s.trim()).filter(Boolean),
    });
  };

  return (
    <AppModal open={open} onClose={onClose} size="md" className="p-6">
      <h3 className="text-lg font-bold mb-4">{vendor ? 'Edit Vendor' : 'Add Vendor'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Vendor Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium w-full mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-premium w-full mt-1">
            {VENDOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-content-muted">Contact Person</label>
            <input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="input-premium w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-content-muted">Phone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-premium w-full mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-premium w-full mt-1" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-content-muted">Destinations (comma separated)</label>
          <input value={form.destinations} onChange={(e) => setForm({ ...form, destinations: e.target.value })} className="input-premium w-full mt-1" placeholder="Goa, Dubai, Kerala" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="teal">{vendor ? 'Save' : 'Add Vendor'}</Button>
        </div>
      </form>
    </AppModal>
  );
}
