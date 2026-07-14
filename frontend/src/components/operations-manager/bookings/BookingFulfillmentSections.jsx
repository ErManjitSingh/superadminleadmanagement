import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hotel, Car, Calendar, MapPin, Utensils, Bus, Compass,
  Save, Plus, Trash2, RefreshCw, Sparkles, Loader2, FileText, ExternalLink,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { formatDate } from '../operationsUtils';
import { CONFIRMATION_CONFIG } from '../constants';
import API from '../../../api/axios';
import { cn } from '../../../lib/utils';

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'innova', label: 'Innova' },
  { value: 'tempo_traveller', label: 'Tempo Traveller' },
  { value: 'bus', label: 'Bus' },
];

const HOTEL_STATUS = ['pending', 'requested', 'confirmed', 'rejected', 'cancelled'];

const MANUAL_HOTEL = '__manual_hotel__';
const MANUAL_CAB = '__manual_cab__';

function formatDayHotelLabel(dayHotel) {
  if (!dayHotel?.hotelName) return '';
  return [dayHotel.hotelName, dayHotel.roomType, dayHotel.mealPlan].filter(Boolean).join(' · ');
}

function formatDayCabLabel(dayCab) {
  if (!dayCab) return '';
  const type = VEHICLE_TYPES.find((v) => v.value === dayCab.vehicleType)?.label || dayCab.vehicleType;
  return [type, dayCab.pickupLocation, dayCab.dropLocation].filter(Boolean).join(' · ');
}

function applyCatalogHotel(day, hotel) {
  const roomType = hotel.roomTypes?.[0]?.name || hotel.roomType || '';
  const dayHotel = {
    hotelId: hotel._id,
    hotelName: hotel.name,
    destination: hotel.destination || '',
    location: hotel.location || '',
    roomType,
    mealPlan: hotel.mealPlan || '',
    source: 'catalog',
  };
  return { ...day, dayHotel, accommodation: formatDayHotelLabel(dayHotel) };
}

function applyCatalogCab(day, cab) {
  const dayCab = {
    cabId: cab._id,
    vehicleType: (cab.vehicleType || 'suv').toLowerCase().replace(/\s+/g, '_'),
    pickupLocation: cab.pickupLocation || '',
    dropLocation: cab.dropLocation || '',
    source: 'catalog',
  };
  return { ...day, dayCab, transport: formatDayCabLabel(dayCab) };
}

function updateDayHotel(day, patch) {
  const dayHotel = { source: 'manual', ...day.dayHotel, ...patch };
  return { ...day, dayHotel, accommodation: formatDayHotelLabel(dayHotel) };
}

function updateDayCab(day, patch) {
  const dayCab = { source: 'manual', ...day.dayCab, ...patch };
  return { ...day, dayCab, transport: formatDayCabLabel(dayCab) };
}

function DayHotelPicker({ day, catalogHotels, onChange }) {
  const selectedId = day.dayHotel?.source === 'catalog' && day.dayHotel?.hotelId
    ? String(day.dayHotel.hotelId)
    : day.dayHotel?.hotelName
      ? MANUAL_HOTEL
      : '';

  const selectedHotel = catalogHotels.find((h) => String(h._id) === String(day.dayHotel?.hotelId));
  const roomOptions = selectedHotel?.roomTypes?.length
    ? selectedHotel.roomTypes
    : selectedHotel?.roomType
      ? [{ name: selectedHotel.roomType }]
      : [];

  const handleSelect = (value) => {
    if (!value) {
      onChange({ ...day, dayHotel: undefined, accommodation: '' });
      return;
    }
    if (value === MANUAL_HOTEL) {
      onChange(updateDayHotel(day, { hotelId: undefined, source: 'manual' }));
      return;
    }
    const hotel = catalogHotels.find((h) => String(h._id) === value);
    if (hotel) onChange(applyCatalogHotel(day, hotel));
  };

  return (
    <div className="rounded-xl border border-teal-500/25 bg-gradient-to-br from-teal-500/[0.06] to-emerald-500/[0.03] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700 flex items-center gap-1.5">
          <Hotel className="w-3.5 h-3.5" /> Hotel for this day
        </span>
        {day.dayHotel?.hotelName && (
          <button
            type="button"
            onClick={() => onChange({ ...day, dayHotel: undefined, accommodation: '' })}
            className="text-[10px] font-medium text-rose-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <select
        value={selectedId}
        onChange={(e) => handleSelect(e.target.value)}
        className="input-premium h-10 w-full rounded-xl text-sm"
      >
        <option value="">— Select hotel from inventory —</option>
        {catalogHotels.map((h) => (
          <option key={h._id} value={h._id}>
            {h.name} · {h.location || h.destination}
          </option>
        ))}
        <option value={MANUAL_HOTEL}>✎ Enter hotel manually</option>
      </select>

      {(selectedId === MANUAL_HOTEL || day.dayHotel?.source === 'manual') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={day.dayHotel?.hotelName || ''}
            onChange={(e) => onChange(updateDayHotel(day, { hotelName: e.target.value, hotelId: undefined }))}
            placeholder="Hotel name"
            className="input-premium h-9 rounded-xl text-sm sm:col-span-2"
          />
          <input
            value={day.dayHotel?.destination || day.dayHotel?.location || ''}
            onChange={(e) => onChange(updateDayHotel(day, { destination: e.target.value, location: e.target.value }))}
            placeholder="City / destination"
            className="input-premium h-9 rounded-xl text-sm"
          />
          <input
            value={day.dayHotel?.roomType || ''}
            onChange={(e) => onChange(updateDayHotel(day, { roomType: e.target.value }))}
            placeholder="Room type"
            className="input-premium h-9 rounded-xl text-sm"
          />
          <input
            value={day.dayHotel?.mealPlan || ''}
            onChange={(e) => onChange(updateDayHotel(day, { mealPlan: e.target.value }))}
            placeholder="Meal plan (MAP / CP)"
            className="input-premium h-9 rounded-xl text-sm sm:col-span-2"
          />
        </div>
      )}

      {day.dayHotel?.source === 'catalog' && selectedHotel && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="sm:col-span-2 rounded-lg bg-white/50 dark:bg-surface/50 px-3 py-2 text-xs text-content-secondary">
            <span className="font-semibold text-content-primary">{selectedHotel.name}</span>
            {selectedHotel.location ? ` · ${selectedHotel.location}` : ''}
            {selectedHotel.category ? ` · ${selectedHotel.category}` : ''}
          </div>
          {roomOptions.length > 1 ? (
            <select
              value={day.dayHotel?.roomType || ''}
              onChange={(e) => onChange(updateDayHotel(day, { roomType: e.target.value, source: 'catalog', hotelId: selectedHotel._id }))}
              className="input-premium h-9 rounded-xl text-sm"
            >
              {roomOptions.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          ) : (
            <input
              value={day.dayHotel?.roomType || ''}
              onChange={(e) => onChange(updateDayHotel(day, { roomType: e.target.value, source: 'catalog', hotelId: selectedHotel._id }))}
              placeholder="Room type"
              className="input-premium h-9 rounded-xl text-sm"
            />
          )}
          <input
            value={day.dayHotel?.mealPlan || ''}
            onChange={(e) => onChange(updateDayHotel(day, { mealPlan: e.target.value, source: 'catalog', hotelId: selectedHotel._id }))}
            placeholder="Meal plan"
            className="input-premium h-9 rounded-xl text-sm"
          />
        </div>
      )}
    </div>
  );
}

function DayCabPicker({ day, catalogCabs, onChange }) {
  const selectedId = day.dayCab?.source === 'catalog' && day.dayCab?.cabId
    ? String(day.dayCab.cabId)
    : day.dayCab?.vehicleType || day.dayCab?.pickupLocation
      ? MANUAL_CAB
      : '';

  const handleSelect = (value) => {
    if (!value) {
      onChange({ ...day, dayCab: undefined, transport: '' });
      return;
    }
    if (value === MANUAL_CAB) {
      onChange(updateDayCab(day, { cabId: undefined, source: 'manual' }));
      return;
    }
    const cab = catalogCabs.find((c) => String(c._id) === value);
    if (cab) onChange(applyCatalogCab(day, cab));
  };

  return (
    <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.03] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700 flex items-center gap-1.5">
          <Car className="w-3.5 h-3.5" /> Cab / transport for this day
        </span>
        {day.dayCab && (day.dayCab.vehicleType || day.dayCab.pickupLocation) && (
          <button
            type="button"
            onClick={() => onChange({ ...day, dayCab: undefined, transport: '' })}
            className="text-[10px] font-medium text-rose-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <select
        value={selectedId}
        onChange={(e) => handleSelect(e.target.value)}
        className="input-premium h-10 w-full rounded-xl text-sm"
      >
        <option value="">— Select cab from fleet —</option>
        {catalogCabs.map((c) => (
          <option key={c._id} value={c._id}>
            {c.vehicleType} · {c.pickupLocation} → {c.dropLocation}
          </option>
        ))}
        <option value={MANUAL_CAB}>✎ Enter cab manually</option>
      </select>

      {(selectedId === MANUAL_CAB || day.dayCab?.source === 'manual') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={day.dayCab?.vehicleType || 'suv'}
            onChange={(e) => onChange(updateDayCab(day, { vehicleType: e.target.value, cabId: undefined }))}
            className="input-premium h-9 rounded-xl text-sm"
          >
            {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
          <input
            value={day.dayCab?.vehicleNumber || ''}
            onChange={(e) => onChange(updateDayCab(day, { vehicleNumber: e.target.value }))}
            placeholder="Vehicle number"
            className="input-premium h-9 rounded-xl text-sm"
          />
          <input
            value={day.dayCab?.pickupLocation || ''}
            onChange={(e) => onChange(updateDayCab(day, { pickupLocation: e.target.value }))}
            placeholder="Pickup location"
            className="input-premium h-9 rounded-xl text-sm"
          />
          <input
            value={day.dayCab?.dropLocation || ''}
            onChange={(e) => onChange(updateDayCab(day, { dropLocation: e.target.value }))}
            placeholder="Drop location"
            className="input-premium h-9 rounded-xl text-sm"
          />
          <input
            value={day.dayCab?.driverName || ''}
            onChange={(e) => onChange(updateDayCab(day, { driverName: e.target.value }))}
            placeholder="Driver name"
            className="input-premium h-9 rounded-xl text-sm"
          />
          <input
            value={day.dayCab?.driverPhone || ''}
            onChange={(e) => onChange(updateDayCab(day, { driverPhone: e.target.value }))}
            placeholder="Driver phone"
            className="input-premium h-9 rounded-xl text-sm"
          />
        </div>
      )}

      {day.dayCab?.source === 'catalog' && day.dayCab?.cabId && (
        <div className="rounded-lg bg-white/50 dark:bg-surface/50 px-3 py-2 text-xs text-content-secondary space-y-1">
          <p>
            <span className="font-semibold text-content-primary capitalize">{day.dayCab.vehicleType?.replace(/_/g, ' ')}</span>
            {day.dayCab.pickupLocation && day.dayCab.dropLocation
              ? ` · ${day.dayCab.pickupLocation} → ${day.dayCab.dropLocation}`
              : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <input
              value={day.dayCab?.driverName || ''}
              onChange={(e) => onChange(updateDayCab(day, { driverName: e.target.value, source: 'catalog', cabId: day.dayCab.cabId }))}
              placeholder="Driver name (optional)"
              className="input-premium h-9 rounded-xl text-sm"
            />
            <input
              value={day.dayCab?.driverPhone || ''}
              onChange={(e) => onChange(updateDayCab(day, { driverPhone: e.target.value, source: 'catalog', cabId: day.dayCab.cabId }))}
              placeholder="Driver phone (optional)"
              className="input-premium h-9 rounded-xl text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionShell({ gradient, icon: Icon, title, subtitle, children, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-surface/90 backdrop-blur-xl shadow-xl shadow-black/5"
    >
      <div className={cn('absolute inset-0 opacity-[0.07] bg-gradient-to-br', gradient)} />
      <div className="relative p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-2xl text-white shadow-lg bg-gradient-to-br', gradient)}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-content-primary tracking-tight">{title}</h3>
              <p className="text-sm text-content-muted mt-0.5">{subtitle}</p>
            </div>
          </div>
          {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        </div>
        {children}
      </div>
    </motion.div>
  );
}

export function QuotationSyncBanner({ meta, onSync, syncing, autoSynced }) {
  if (!meta?.quoteNumber) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-teal-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-500/15">
          <Sparkles className="w-4 h-4 text-sky-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-content-primary">
            {autoSynced ? 'Auto-loaded from executive quotation' : 'Linked quotation'}
            <span className="ml-2 font-mono text-sky-600">{meta.quoteNumber}</span>
          </p>
          <p className="text-xs text-content-muted mt-0.5">
            Itinerary & hotels match what the customer received · Ops can edit below
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="rounded-xl gap-2 border-sky-500/30 hover:bg-sky-500/10" disabled={syncing} onClick={onSync}>
        {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Refresh from quote
      </Button>
    </motion.div>
  );
}

export function BookingHotelsEditor({ hotels, onChange, onSave, saving, catalogHotels = [], onCatalogHotelsChange }) {
  const [rowModes, setRowModes] = useState({});
  const [savingRow, setSavingRow] = useState(null);

  const update = (i, field, value) => {
    onChange(hotels.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));
  };

  const applyCatalogToRow = (i, hotelId) => {
    if (!hotelId) return;
    const hotel = catalogHotels.find((h) => String(h._id) === String(hotelId));
    if (!hotel) return;
    onChange(hotels.map((h, idx) => (idx === i ? {
      ...h,
      hotelId: hotel._id,
      hotelName: hotel.name,
      destination: hotel.destination || hotel.location || '',
      category: hotel.category || '',
      roomType: hotel.roomTypes?.[0]?.name || hotel.roomType || '',
      mealPlan: hotel.mealPlan || '',
      phone: hotel.phone || h.phone || '',
    } : h)));
    setRowModes((m) => ({ ...m, [i]: 'existing' }));
  };

  const addHotel = () => {
    onChange([...hotels, { hotelName: '', destination: '', roomType: '', mealPlan: '', status: 'pending' }]);
  };

  const remove = (i) => onChange(hotels.filter((_, idx) => idx !== i));

  const getMode = (h, i) => {
    if (rowModes[i]) return rowModes[i];
    if (h.hotelId) return 'existing';
    if (h.hotelName?.trim()) return 'new';
    return catalogHotels.length ? 'existing' : 'new';
  };

  const saveHotelToCatalog = async (i) => {
    const h = (hotels.length ? hotels : [{ hotelName: '' }])[i];
    const name = String(h?.hotelName || '').trim();
    if (!name) return;
    setSavingRow(i);
    try {
      const location = String(h.destination || 'India').trim() || 'India';
      const { data } = await API.post('/hotels', {
        name,
        location,
        destination: h.destination || location,
        category: h.category || '4 Star',
        roomType: h.roomType || 'Standard',
        mealPlan: h.mealPlan || '',
        phone: h.phone || '',
        status: 'active',
      });
      onChange((hotels.length ? hotels : [{ hotelName: '' }]).map((row, idx) => (idx === i ? {
        ...row,
        hotelId: data._id,
        hotelName: data.name,
        destination: data.destination || data.location || row.destination,
      } : row)));
      onCatalogHotelsChange?.([data, ...catalogHotels.filter((c) => String(c._id) !== String(data._id))]);
      setRowModes((m) => ({ ...m, [i]: 'existing' }));
    } catch {
      /* toast handled by API */
    } finally {
      setSavingRow(null);
    }
  };

  return (
    <SectionShell
      gradient="from-teal-500 to-emerald-600"
      icon={Hotel}
      title="Hotel Assignments"
      subtitle="Existing company hotels or add new — saved hotels appear on all leads"
      actions={(
        <>
          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={addHotel}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
          <Button variant="teal" size="sm" className="rounded-xl gap-1" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Hotels
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        {(hotels.length ? hotels : [{ hotelName: '', status: 'pending' }]).map((h, i) => {
          const mode = getMode(h, i);
          return (
          <div key={i} className="rounded-2xl border border-subtle/80 bg-white/40 dark:bg-surface-elevated/40 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className={cn('text-[10px] font-bold uppercase px-2.5 py-1 rounded-full', CONFIRMATION_CONFIG[h.status]?.className || 'bg-slate-500/15')}>
                {CONFIRMATION_CONFIG[h.status]?.label || h.status || 'Pending'}
              </span>
              {hotels.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRowModes((m) => ({ ...m, [i]: 'existing' }))}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                  mode === 'existing' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'border-subtle text-content-muted',
                )}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  setRowModes((m) => ({ ...m, [i]: 'new' }));
                  update(i, 'hotelId', '');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                  mode === 'new' ? 'bg-teal-50 border-teal-500 text-teal-800' : 'border-subtle text-content-muted',
                )}
              >
                Add New
              </button>
            </div>
            {mode === 'existing' ? (
              <select
                value={h.hotelId || ''}
                onChange={(e) => applyCatalogToRow(i, e.target.value)}
                className="input-premium h-10 w-full rounded-xl text-sm"
              >
                <option value="">— Pick from hotel inventory —</option>
                {catalogHotels.map((opt) => (
                  <option key={opt._id} value={opt._id}>{opt.name} · {opt.location || opt.destination}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                <input value={h.hotelName || ''} onChange={(e) => update(i, 'hotelName', e.target.value)} placeholder="Hotel name" className="input-premium h-10 rounded-xl text-sm font-medium flex-1 min-w-[160px]" />
                <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" disabled={savingRow === i || !h.hotelName?.trim()} onClick={() => saveHotelToCatalog(i)}>
                  {savingRow === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save to inventory
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mode === 'existing' && (
                <input value={h.hotelName || ''} onChange={(e) => update(i, 'hotelName', e.target.value)} placeholder="Hotel name" className="input-premium h-10 rounded-xl text-sm font-medium" />
              )}
              <input value={h.destination || ''} onChange={(e) => update(i, 'destination', e.target.value)} placeholder="Destination / city" className="input-premium h-10 rounded-xl text-sm" />
              <input value={h.roomType || ''} onChange={(e) => update(i, 'roomType', e.target.value)} placeholder="Room type" className="input-premium h-10 rounded-xl text-sm" />
              <input value={h.mealPlan || ''} onChange={(e) => update(i, 'mealPlan', e.target.value)} placeholder="Meal plan (MAP/CP)" className="input-premium h-10 rounded-xl text-sm" />
              <input type="date" value={h.checkIn ? String(h.checkIn).slice(0, 10) : ''} onChange={(e) => update(i, 'checkIn', e.target.value)} className="input-premium h-10 rounded-xl text-sm" />
              <input type="date" value={h.checkOut ? String(h.checkOut).slice(0, 10) : ''} onChange={(e) => update(i, 'checkOut', e.target.value)} className="input-premium h-10 rounded-xl text-sm" />
              <select value={h.status || 'pending'} onChange={(e) => update(i, 'status', e.target.value)} className="input-premium h-10 rounded-xl text-sm sm:col-span-2">
                {HOTEL_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function BookingTransportEditor({
  transport,
  onChange,
  onSave,
  saving,
  catalogCabs = [],
  catalogVendors = [],
  onCatalogVendorsChange,
}) {
  const [rowModes, setRowModes] = useState({});
  const [savingVendorRow, setSavingVendorRow] = useState(null);

  const update = (i, field, value) => {
    onChange(transport.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  };

  const applyCatalogCabToRow = (i, cabId) => {
    if (!cabId) return;
    const cab = catalogCabs.find((c) => String(c._id) === String(cabId));
    if (!cab) return;
    onChange(transport.map((t, idx) => (idx === i ? {
      ...t,
      vehicleType: (cab.vehicleType || 'suv').toLowerCase().replace(/\s+/g, '_'),
      pickupLocation: cab.pickupLocation || '',
      dropLocation: cab.dropLocation || '',
    } : t)));
  };

  const applyVendorToRow = (i, vendorId) => {
    if (!vendorId) return;
    const vendor = catalogVendors.find((v) => String(v._id) === String(vendorId));
    if (!vendor) return;
    onChange(transport.map((t, idx) => (idx === i ? {
      ...t,
      vendorId: vendor._id,
      vendorName: vendor.name || '',
      vendorPhone: vendor.phone || '',
      driverPhone: t.driverPhone || vendor.phone || '',
    } : t)));
    setRowModes((m) => ({ ...m, [i]: 'existing' }));
  };

  const addRow = () => {
    onChange([...transport, { vehicleType: 'suv', pickupLocation: '', dropLocation: '', status: 'pending' }]);
  };

  const remove = (i) => onChange(transport.filter((_, idx) => idx !== i));

  const getMode = (t, i) => {
    if (rowModes[i]) return rowModes[i];
    if (t.vendorId) return 'existing';
    if (t.vendorName?.trim()) return 'new';
    return catalogVendors.length ? 'existing' : 'new';
  };

  const saveVendorToCatalog = async (i) => {
    const t = (transport.length ? transport : [{ vendorName: '' }])[i];
    const name = String(t?.vendorName || '').trim();
    if (!name) return;
    setSavingVendorRow(i);
    try {
      const { data } = await API.post('/vendors', {
        name,
        type: 'transport',
        phone: t.vendorPhone || t.driverPhone || '',
        status: 'active',
      });
      onChange((transport.length ? transport : [{ vendorName: '' }]).map((row, idx) => (idx === i ? {
        ...row,
        vendorId: data._id,
        vendorName: data.name,
        vendorPhone: data.phone || row.vendorPhone,
      } : row)));
      onCatalogVendorsChange?.([data, ...catalogVendors.filter((v) => String(v._id) !== String(data._id))]);
      setRowModes((m) => ({ ...m, [i]: 'existing' }));
    } catch {
      /* API toast */
    } finally {
      setSavingVendorRow(null);
    }
  };

  const transportVendors = catalogVendors.filter(
    (v) => !v.type || v.type === 'transport' || v.type === 'cab' || v.type === 'other',
  );

  return (
    <SectionShell
      gradient="from-violet-500 to-purple-600"
      icon={Car}
      title="Transport & Cabs"
      subtitle="Existing vendor or add new — saved vendors appear on all leads"
      actions={(
        <>
          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={addRow}>
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
          <Button variant="violet" size="sm" className="rounded-xl gap-1" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Transport
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        {(transport.length ? transport : [{ vehicleType: 'suv', status: 'pending' }]).map((t, i) => {
          const mode = getMode(t, i);
          return (
          <div key={i} className="rounded-2xl border border-subtle/80 bg-white/40 dark:bg-surface-elevated/40 p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Vehicle #{i + 1}</span>
              {transport.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRowModes((m) => ({ ...m, [i]: 'existing' }))}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                  mode === 'existing' ? 'bg-violet-50 border-violet-500 text-violet-800' : 'border-subtle text-content-muted',
                )}
              >
                Existing Vendor
              </button>
              <button
                type="button"
                onClick={() => {
                  setRowModes((m) => ({ ...m, [i]: 'new' }));
                  update(i, 'vendorId', '');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border',
                  mode === 'new' ? 'bg-violet-50 border-violet-500 text-violet-800' : 'border-subtle text-content-muted',
                )}
              >
                Add New Vendor
              </button>
            </div>

            {mode === 'existing' ? (
              <select
                value={t.vendorId || ''}
                onChange={(e) => applyVendorToRow(i, e.target.value)}
                className="input-premium h-10 w-full rounded-xl text-sm"
              >
                <option value="">— Pick vendor partner —</option>
                {transportVendors.map((v) => (
                  <option key={v._id} value={v._id}>{v.name}{v.phone ? ` · ${v.phone}` : ''}</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={t.vendorName || ''} onChange={(e) => update(i, 'vendorName', e.target.value)} placeholder="Vendor name" className="input-premium h-10 rounded-xl text-sm" />
                <div className="flex gap-2">
                  <input value={t.vendorPhone || ''} onChange={(e) => update(i, 'vendorPhone', e.target.value)} placeholder="Vendor phone" className="input-premium h-10 rounded-xl text-sm flex-1" />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1 shrink-0" disabled={savingVendorRow === i || !t.vendorName?.trim()} onClick={() => saveVendorToCatalog(i)}>
                    {savingVendorRow === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </Button>
                </div>
              </div>
            )}

            {catalogCabs.length > 0 && (
              <select
                value=""
                onChange={(e) => applyCatalogCabToRow(i, e.target.value)}
                className="input-premium h-10 w-full rounded-xl text-sm"
              >
                <option value="">— Pick from cab fleet —</option>
                {catalogCabs.map((c) => (
                  <option key={c._id} value={c._id}>{c.vehicleType} · {c.pickupLocation} → {c.dropLocation}</option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={t.vehicleType || 'suv'} onChange={(e) => update(i, 'vehicleType', e.target.value)} className="input-premium h-10 rounded-xl text-sm">
                {VEHICLE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
              <input value={t.driverName || ''} onChange={(e) => update(i, 'driverName', e.target.value)} placeholder="Driver name" className="input-premium h-10 rounded-xl text-sm" />
              <input value={t.driverPhone || ''} onChange={(e) => update(i, 'driverPhone', e.target.value)} placeholder="Driver phone" className="input-premium h-10 rounded-xl text-sm" />
              <input value={t.vehicleNumber || ''} onChange={(e) => update(i, 'vehicleNumber', e.target.value)} placeholder="Vehicle number" className="input-premium h-10 rounded-xl text-sm" />
              <input value={t.pickupLocation || ''} onChange={(e) => update(i, 'pickupLocation', e.target.value)} placeholder="Pickup location" className="input-premium h-10 rounded-xl text-sm" />
              <input value={t.dropLocation || ''} onChange={(e) => update(i, 'dropLocation', e.target.value)} placeholder="Drop location" className="input-premium h-10 rounded-xl text-sm" />
            </div>
          </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function BookingItineraryTimeline({
  itinerary, onChange, onSave, saving, onPdf, generatingPdf, pdfUrl,
  catalogHotels = [], catalogCabs = [],
}) {
  const update = (i, field, value) => {
    onChange(itinerary.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  };

  const addDay = () => {
    onChange([...itinerary, {
      day: itinerary.length + 1,
      title: '',
      description: '',
      meals: '',
      accommodation: '',
      transport: '',
      activities: '',
      dayHotel: undefined,
      dayCab: undefined,
    }]);
  };

  const removeDay = (i) => onChange(itinerary.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 })));

  const updateDay = (i, nextDay) => {
    onChange(itinerary.map((d, idx) => (idx === i ? nextDay : d)));
  };

  return (
    <SectionShell
      gradient="from-cyan-500 to-teal-600"
      icon={Calendar}
      title="Day-wise Itinerary"
      subtitle="Same plan the executive shared with the customer — refine for operations"
      actions={(
        <>
          <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={addDay}>
            <Plus className="w-3.5 h-3.5" /> Add Day
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1" disabled={generatingPdf} onClick={onPdf}>
            {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            PDF
          </Button>
          <Button variant="teal" size="sm" className="rounded-xl gap-1" disabled={saving} onClick={onSave}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </>
      )}
    >
      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline mb-4">
          <ExternalLink className="w-3 h-3" /> Open itinerary PDF
        </a>
      )}

      <div className="relative pl-2 sm:pl-4">
        <div className="absolute left-[1.15rem] sm:left-[1.65rem] top-3 bottom-3 w-0.5 bg-gradient-to-b from-teal-500/60 via-cyan-400/40 to-transparent rounded-full" />
        <div className="space-y-5">
          {itinerary.map((day, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative pl-10 sm:pl-12"
            >
              <div className="absolute left-0 top-1 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-teal-500/30 z-10">
                {day.day || i + 1}
              </div>
              <div className="rounded-2xl border border-subtle/70 bg-white/50 dark:bg-surface-elevated/50 p-4 sm:p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <input
                    value={day.title || ''}
                    onChange={(e) => update(i, 'title', e.target.value)}
                    placeholder="Day title"
                    className="flex-1 text-base font-bold bg-transparent border-none outline-none text-content-primary placeholder:text-content-muted"
                  />
                  {itinerary.length > 1 && (
                    <button type="button" onClick={() => removeDay(i)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={day.description || ''}
                  onChange={(e) => update(i, 'description', e.target.value)}
                  placeholder="Day overview & highlights..."
                  rows={2}
                  className="input-premium w-full rounded-xl text-sm resize-none"
                />
                <div className="space-y-3">
                  <DayHotelPicker
                    day={day}
                    catalogHotels={catalogHotels}
                    onChange={(next) => updateDay(i, next)}
                  />
                  <DayCabPicker
                    day={day}
                    catalogCabs={catalogCabs}
                    onChange={(next) => updateDay(i, next)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { field: 'meals', icon: Utensils, placeholder: 'Meals (B/L/D)', color: 'text-amber-600' },
                      { field: 'activities', icon: Compass, placeholder: 'Activities & sightseeing', color: 'text-rose-600' },
                    ].map(({ field, icon: Icon, placeholder, color }) => (
                      <div key={field} className="flex items-center gap-2 rounded-xl border border-subtle/60 bg-surface/60 px-3 py-2">
                        <Icon className={cn('w-3.5 h-3.5 shrink-0', color)} />
                        <input
                          value={day[field] || ''}
                          onChange={(e) => update(i, field, e.target.value)}
                          placeholder={placeholder}
                          className="flex-1 bg-transparent text-xs outline-none placeholder:text-content-muted"
                        />
                      </div>
                    ))}
                  </div>
                  {(day.accommodation || day.transport) && (
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {day.accommodation && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 text-teal-700">
                          <Hotel className="w-3 h-3" /> {day.accommodation}
                        </span>
                      )}
                      {day.transport && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 text-violet-700">
                          <Bus className="w-3 h-3" /> {day.transport}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {day.date && (
                  <p className="text-[10px] text-content-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {formatDate(day.date)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
