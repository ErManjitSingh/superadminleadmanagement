import { useState } from 'react';
import { Plus, Pencil, Trash2, Hotel, Car, Plane } from 'lucide-react';
import { Button } from '../ui/button';
import { HOTEL_CATEGORIES, MEAL_PLANS } from '../quotations/constants';
import { formatINR } from '../quotations/quotationUtils';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'hotels', label: 'Hotels', icon: Hotel, color: 'amber' },
  { id: 'cabs', label: 'Cabs', icon: Car, color: 'emerald' },
  { id: 'flights', label: 'Flights', icon: Plane, color: 'sky' },
];

const tabVariant = {
  amber: 'amber',
  emerald: 'emerald',
  sky: 'sky',
};

const FORMS = {
  hotels: { name: '', category: '4 Star', location: '', roomType: '', mealPlan: 'CP (Breakfast)', price: '' },
  cabs: { vehicleType: '', pickupLocation: '', dropLocation: '', cost: '' },
  flights: { airline: '', flightNumber: '', departure: '', arrival: '', cost: '' },
};

export default function ResourceManagement({ hotels, cabs, flights, onSave, onDelete }) {
  const [tab, setTab] = useState('hotels');
  const [form, setForm] = useState(FORMS.hotels);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const lists = { hotels, cabs, flights };
  const list = lists[tab];

  const openAdd = () => {
    setEditId(null);
    setForm({ ...FORMS[tab] });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditId(item._id);
    setForm({ ...item, price: item.price ?? item.cost ?? '' });
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = { ...form, price: Number(form.price || form.cost), cost: Number(form.cost || form.price) };
    onSave(tab, payload, editId);
    setShowForm(false);
    setEditId(null);
  };

  return (
    <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
      <div className="flex border-b border-subtle">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setShowForm(false); }} className={cn('flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all', tab === t.id ? 'bg-brand-600 text-white' : 'text-content-muted hover:bg-surface-elevated')}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-4">
          <p className="text-sm font-semibold text-content-primary capitalize">{tab} Inventory</p>
          <Button size="sm" variant={tabVariant[TABS.find((t) => t.id === tab).color]} onClick={openAdd} className="rounded-lg h-8 gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        {showForm && (
          <div className="mb-4 p-4 rounded-xl border border-subtle bg-surface-elevated/40 space-y-3">
            {tab === 'hotels' && (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Hotel Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium h-9 rounded-lg text-sm col-span-2" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-premium h-9 rounded-lg text-sm">{HOTEL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input placeholder="Room Type" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })} className="input-premium h-9 rounded-lg text-sm">{MEAL_PLANS.map((m) => <option key={m}>{m}</option>)}</select>
                <input type="number" placeholder="Price/night" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
              </div>
            )}
            {tab === 'cabs' && (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Vehicle Type" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="input-premium h-9 rounded-lg text-sm col-span-2" />
                <input placeholder="Pickup" value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input placeholder="Drop" value={form.dropLocation} onChange={(e) => setForm({ ...form, dropLocation: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input-premium h-9 rounded-lg text-sm col-span-2" />
              </div>
            )}
            {tab === 'flights' && (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Airline" value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input placeholder="Flight No." value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input placeholder="Departure" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input placeholder="Arrival" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} className="input-premium h-9 rounded-lg text-sm" />
                <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input-premium h-9 rounded-lg text-sm col-span-2" />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="button" size="sm" className="rounded-lg" onClick={handleSave}>{editId ? 'Update' : 'Save'}</Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin">
          {list.map((item) => (
            <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl border border-subtle hover:bg-surface-elevated/50 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content-primary truncate">
                  {item.name || item.vehicleType || `${item.airline} ${item.flightNumber}`}
                </p>
                <p className="text-xs text-content-muted truncate">
                  {tab === 'hotels' && `${item.category} · ${item.location}`}
                  {tab === 'cabs' && `${item.pickupLocation} → ${item.dropLocation}`}
                  {tab === 'flights' && `${item.departure} → ${item.arrival}`}
                </p>
              </div>
              <span className="text-sm font-bold text-content-primary shrink-0">{formatINR(item.price || item.cost)}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button type="button" onClick={() => openEdit(item)} className="p-1 rounded hover:bg-brand-500/10 text-brand-600"><Pencil className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => onDelete(tab, item._id)} className="p-1 rounded hover:bg-red-500/10 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
