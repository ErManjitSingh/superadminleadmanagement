import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import AppModal from '../ui/AppModal';
import { PACKAGE_TYPES } from '../quotations/constants';
import { defaultItineraryDay } from '../quotations/quotationUtils';
import ItineraryBuilder from './ItineraryBuilder';
import { cn } from '../../lib/utils';

const empty = { name: '', destination: '', duration: 5, startingPrice: '', packageType: 'family', itinerary: [] };

export default function PackageFormModal({ open, onClose, onSubmit, editPackage }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editPackage) {
      setForm({ ...editPackage, startingPrice: editPackage.startingPrice || '' });
    } else {
      setForm({ ...empty, itinerary: [defaultItineraryDay(1, ''), defaultItineraryDay(2, ''), defaultItineraryDay(3, ''), defaultItineraryDay(4, '')] });
    }
  }, [editPackage, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, startingPrice: Number(form.startingPrice), duration: form.itinerary.length || Number(form.duration) });
  };

  return (
    <AppModal open={open} onClose={onClose} size="2xl" className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-content-primary">{editPackage ? 'Edit Package' : 'Add Package'}</h3>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-content-muted mb-1 block">Package Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium w-full h-11 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-content-muted mb-1 block">Destination *</label>
                  <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value, itinerary: form.itinerary.map((d) => ({ ...d, title: d.title.replace(form.destination, e.target.value) })) })} className="input-premium w-full h-11 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-content-muted mb-1 block">Starting Price (₹) *</label>
                  <input required type="number" min={0} value={form.startingPrice} onChange={(e) => setForm({ ...form, startingPrice: e.target.value })} className="input-premium w-full h-11 rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-content-muted mb-2 block">Package Type</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PACKAGE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, packageType: t.value })}
                      className={cn(
                        'py-2 px-1 rounded-xl text-[10px] sm:text-xs font-semibold border transition-all bg-gradient-to-br',
                        form.packageType === t.value ? t.color + ' ring-2 ring-offset-1 ring-current/20' : 'border-subtle text-content-muted'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <ItineraryBuilder itinerary={form.itinerary} onChange={(itinerary) => setForm({ ...form, itinerary, duration: itinerary.length })} destination={form.destination} />
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="amber" className="flex-1 rounded-xl">{editPackage ? 'Update' : 'Create'} Package</Button>
              </div>
            </form>
    </AppModal>
  );
}
