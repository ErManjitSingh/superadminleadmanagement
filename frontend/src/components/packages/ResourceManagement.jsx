import { useState } from 'react';
import { Plus, Pencil, Trash2, Hotel, Car, Plane, Sparkles, Star, Upload, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { HOTEL_CATEGORIES, MEAL_PLANS } from '../quotations/constants';
import { formatINR } from '../quotations/quotationUtils';
import { readHotelImageFile } from '../quotations/hotelImageUtils';
import { cn } from '../../lib/utils';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';

const TABS = [
  { id: 'hotels', label: 'Hotels', icon: Hotel },
  { id: 'cabs', label: 'Cabs', icon: Car },
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'activities', label: 'Activities', icon: Sparkles },
];

const FORMS = {
  hotels: { name: '', category: '4 Star', location: '', roomType: '', mealPlan: 'CP (Breakfast)', price: '', image: '', rating: 4.5 },
  cabs: { vehicleType: '', pickupLocation: '', dropLocation: '', cost: '' },
  flights: { airline: '', flightNumber: '', departure: '', arrival: '', cost: '' },
  activities: { name: '', description: '', duration: '', price: 0, destination: '' },
};

const CATEGORY_BADGE = {
  '3 Star': 'STANDARD',
  '4 Star': 'DELUXE',
  '5 Star': 'PREMIUM',
  Luxury: 'LUXURY',
  Budget: 'BUDGET',
  Boutique: 'BOUTIQUE',
};

function HotelCard({ hotel, onEdit, onDelete }) {
  const badge = CATEGORY_BADGE[hotel.category] || hotel.category?.toUpperCase() || 'DELUXE';
  return (
    <div className="group rounded-2xl border border-violet-500/15 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm hover:shadow-lg transition-all">
      <div className="relative h-36 bg-gradient-to-br from-slate-700 to-slate-900">
        {hotel.image ? (
          <img src={hotel.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">🏨</div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenuRoot>
            <DropdownMenuTrigger asChild>
              <button type="button" className="w-8 h-8 rounded-lg bg-black/40 text-white flex items-center justify-center backdrop-blur-sm">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(hotel)}><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(hotel._id)}><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuRoot>
        </div>
        <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-violet-600 text-white">
          {badge}
        </span>
      </div>
      <div className="p-4">
        <h4 className="font-bold text-sm text-content-primary">{hotel.name}</h4>
        <p className="text-xs text-content-muted mt-0.5">{hotel.location}</p>
        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="font-semibold">{hotel.rating || 4.5}</span>
          <span className="text-content-muted">(120)</span>
        </div>
        <p className="text-sm font-bold text-content-primary mt-2">{formatINR(hotel.price)}/night</p>
      </div>
    </div>
  );
}

export default function ResourceManagement({ hotels, cabs, flights, activities = [], onSave, onDelete }) {
  const [tab, setTab] = useState('hotels');
  const [form, setForm] = useState(FORMS.hotels);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imageError, setImageError] = useState('');

  const lists = { hotels, cabs, flights, activities };
  const list = lists[tab] || [];

  const openAdd = () => {
    setEditId(null);
    setForm({ ...FORMS[tab] });
    setImageError('');
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditId(item._id);
    setForm({ ...FORMS[tab], ...item, price: item.price ?? item.cost ?? '' });
    setImageError('');
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      price: Number(form.price || form.cost || 0),
      cost: Number(form.cost || form.price || 0),
    };
    onSave(tab, payload, editId);
    setShowForm(false);
    setEditId(null);
  };

  return (
    <div className="rounded-2xl border border-violet-500/15 bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl shadow-lg overflow-hidden">
      <div className="flex border-b border-violet-500/10 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setShowForm(false); }}
              className={cn(
                'flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all',
                tab === t.id ? 'bg-violet-600 text-white' : 'text-content-muted hover:bg-violet-500/5'
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <p className="text-base font-bold text-content-primary capitalize">{tab} Inventory</p>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-56">
              <input placeholder={`Search ${tab}...`} className="input-premium w-full h-9 rounded-xl text-sm" />
            </div>
            <Button size="sm" onClick={openAdd} className="rounded-xl h-9 gap-1 bg-violet-600 hover:bg-violet-500 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Add {tab === 'hotels' ? 'Hotel' : tab.slice(0, -1)}
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="mb-5 p-4 rounded-2xl border border-violet-500/15 bg-violet-500/5 space-y-3">
            {tab === 'hotels' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Hotel Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-premium h-10 rounded-xl text-sm">
                  {HOTEL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input placeholder="Room Type" value={form.roomType} onChange={(e) => setForm({ ...form, roomType: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })} className="input-premium h-10 rounded-xl text-sm">
                  {MEAL_PLANS.map((m) => <option key={m}>{m}</option>)}
                </select>
                <input type="number" placeholder="Price/night" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                  {form.image && <img src={form.image} alt="" className="w-20 h-20 rounded-xl object-cover border" />}
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm">
                    <Upload className="w-4 h-4" /> Upload image (max 500 KB)
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      try {
                        setImageError('');
                        setForm({ ...form, image: await readHotelImageFile(file) });
                      } catch (err) {
                        setImageError(err.message);
                      }
                    }} />
                  </label>
                  {imageError && <p className="text-xs text-red-600 w-full">{imageError}</p>}
                </div>
              </div>
            )}
            {tab === 'cabs' && (
              <div className="grid sm:grid-cols-2 gap-2">
                <input placeholder="Vehicle Type" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
                <input placeholder="Pickup" value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input placeholder="Drop" value={form.dropLocation} onChange={(e) => setForm({ ...form, dropLocation: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
              </div>
            )}
            {tab === 'flights' && (
              <div className="grid sm:grid-cols-2 gap-2">
                <input placeholder="Airline" value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input placeholder="Flight No." value={form.flightNumber} onChange={(e) => setForm({ ...form, flightNumber: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input placeholder="Departure" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input placeholder="Arrival" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
              </div>
            )}
            {tab === 'activities' && (
              <div className="grid sm:grid-cols-2 gap-2">
                <input placeholder="Activity Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
                <input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input placeholder="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="input-premium h-10 rounded-xl text-sm" />
                <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-premium h-10 rounded-xl text-sm sm:col-span-2" />
                <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-premium rounded-xl text-sm sm:col-span-2 resize-none" />
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="button" size="sm" className="rounded-xl bg-violet-600 hover:bg-violet-500" onClick={handleSave}>{editId ? 'Update' : 'Save'}</Button>
            </div>
          </div>
        )}

        {tab === 'hotels' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {hotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} onEdit={openEdit} onDelete={(id) => onDelete('hotels', id)} />
            ))}
            {!hotels.length && (
              <p className="text-sm text-content-muted col-span-full text-center py-8">No hotels in inventory — click Add Hotel</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {list.map((item) => (
              <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl border border-subtle hover:bg-violet-500/5 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content-primary truncate">
                    {item.name || item.vehicleType || `${item.airline} ${item.flightNumber}`}
                  </p>
                  <p className="text-xs text-content-muted truncate">
                    {tab === 'cabs' && `${item.pickupLocation} → ${item.dropLocation}`}
                    {tab === 'flights' && `${item.departure} → ${item.arrival}`}
                    {tab === 'activities' && `${item.destination || ''} · ${item.duration || ''}`}
                  </p>
                </div>
                <span className="text-sm font-bold shrink-0">{formatINR(item.price || item.cost)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-violet-500/10 text-violet-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => onDelete(tab, item._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {!list.length && <p className="text-sm text-content-muted text-center py-8">No items yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
