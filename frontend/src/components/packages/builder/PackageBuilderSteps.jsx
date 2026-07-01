import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Upload, ImagePlus } from 'lucide-react';
import { Button } from '../../ui/button';
import TimelineItineraryBuilder from '../../quotations/builder/TimelineItineraryBuilder';
import InclusionExclusionEditor, { cleanInclusionExclusionLines } from '../../quotations/InclusionExclusionEditor';
import { HOTEL_CATEGORIES, MEAL_PLANS, PACKAGE_TYPES } from '../../quotations/constants';
import { formatINR } from '../../quotations/quotationUtils';
import { readHotelImageFile } from '../../quotations/hotelImageUtils';
import {
  PACKAGE_STATUS_OPTIONS,
  PACKAGE_TAG_OPTIONS,
  PACKAGE_FEATURE_OPTIONS,
  TRANSPORT_TYPES,
  DIFFICULTY_OPTIONS,
  DEFAULT_DESTINATIONS,
  INCLUSION_PRESETS,
  EXCLUSION_PRESETS,
} from './packageBuilderConstants';
import { cn } from '../../../lib/utils';

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <label className="text-[10px] uppercase font-bold text-content-muted tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function inputCls(extra = '') {
  return cn('input-premium w-full h-10 rounded-xl text-sm', extra);
}

export function StepBasics({ b }) {
  const s = b.state;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">Basic Details</h2>
        <p className="text-sm text-content-muted">Package identity, routing & cover image</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Package Name *" className="sm:col-span-2">
          <input value={s.name} onChange={(e) => b.update({ name: e.target.value })} className={inputCls()} placeholder="Himachal Honeymoon Special" />
        </Field>
        <Field label="Slug">
          <input value={s.slug} onChange={(e) => b.update({ slug: e.target.value })} className={inputCls()} placeholder="auto-generated" />
        </Field>
        <Field label="Package Code">
          <input value={s.packageCode} onChange={(e) => b.update({ packageCode: e.target.value })} className={inputCls()} placeholder="IHD-HP-001" />
        </Field>
        <Field label="Destination *">
          <input value={s.destination} onChange={(e) => b.update({ destination: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="State">
          <input value={s.state} onChange={(e) => b.update({ state: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Country">
          <input value={s.country} onChange={(e) => b.update({ country: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Days *">
          <input type="number" min={1} value={s.days || s.duration} onChange={(e) => {
            const days = Number(e.target.value) || 1;
            b.update({ days, duration: days, nights: Math.max(0, days - 1) });
          }} className={inputCls()} />
        </Field>
        <Field label="Nights">
          <input type="number" min={0} value={s.nights} onChange={(e) => b.update({ nights: Number(e.target.value) })} className={inputCls()} />
        </Field>
        <Field label="Starting City">
          <input value={s.startingCity} onChange={(e) => b.update({ startingCity: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Ending City">
          <input value={s.endingCity} onChange={(e) => b.update({ endingCity: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Best Time">
          <input value={s.bestTime} onChange={(e) => b.update({ bestTime: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Difficulty">
          <select value={s.difficulty} onChange={(e) => b.update({ difficulty: e.target.value })} className={inputCls()}>
            {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <div>
        <p className="text-[10px] uppercase font-bold text-content-muted mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          {PACKAGE_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => b.update({ packageType: t.value })}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', s.packageType === t.value ? 'bg-amber-500 text-white border-amber-500' : 'border-subtle hover:bg-white/50')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase font-bold text-content-muted mb-2">Status</p>
        <div className="flex flex-wrap gap-2">
          {PACKAGE_STATUS_OPTIONS.map((st) => (
            <button key={st.value} type="button" onClick={() => b.update({ status: st.value })}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border', s.status === st.value ? st.color + ' ring-2 ring-offset-1 ring-amber-400/40' : 'border-subtle')}>
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Short Description">
        <textarea value={s.shortDescription} onChange={(e) => b.update({ shortDescription: e.target.value })} rows={2} className={inputCls('h-auto py-2 resize-none')} />
      </Field>
      <Field label="Long Description">
        <textarea value={s.longDescription} onChange={(e) => b.update({ longDescription: e.target.value })} rows={5} className={inputCls('h-auto py-2 resize-none')} />
      </Field>

      <CoverImageUpload coverImage={s.coverImage} onChange={(url) => b.update({ coverImage: url })} label="Cover Image (max 500 KB)" />
    </div>
  );
}

function SortableDestination({ dest, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dest.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.85 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl border border-subtle bg-white/60 dark:bg-slate-900/40 overflow-hidden">
      <div className="flex gap-3 p-3">
        <button type="button" {...attributes} {...listeners} className="p-2 rounded-lg hover:bg-white/50 self-start cursor-grab">
          <GripVertical className="w-4 h-4 text-content-muted" />
        </button>
        <div className="w-20 h-20 rounded-xl bg-surface-elevated overflow-hidden shrink-0">
          {dest.image ? <img src={dest.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">📍</div>}
        </div>
        <div className="flex-1 grid sm:grid-cols-2 gap-2">
          <input value={dest.name} onChange={(e) => onChange({ ...dest, name: e.target.value })} placeholder="Destination" className={inputCls('h-9')} />
          <input value={dest.state} onChange={(e) => onChange({ ...dest, state: e.target.value })} placeholder="State" className={inputCls('h-9')} />
          <label className="sm:col-span-2 inline-flex items-center gap-2 text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Upload image
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try { onChange({ ...dest, image: await readHotelImageFile(file) }); } catch { /* ignore */ }
            }} />
          </label>
        </div>
        <button type="button" onClick={onRemove} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg self-start"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function StepDestinations({ b }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const destinations = (b.state.destinations || []).map((d, i) => ({ ...d, id: d._id || d.id || `dest-${i}` }));

  const updateList = (list) => b.setDestinations(list.map((d, i) => ({ ...d, order: i })));

  const addDest = (preset) => {
    const item = preset || { name: '', state: b.state.state || '', country: 'India', image: '' };
    updateList([...destinations, { ...item, id: `dest-${Date.now()}` }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl font-black">Destinations</h2>
          <p className="text-sm text-content-muted">Drag to reorder — add multiple stops on the route</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => addDest()}>
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEFAULT_DESTINATIONS.map((d) => (
          <button key={d.name} type="button" onClick={() => addDest(d)} className="px-3 py-1.5 rounded-full text-xs font-medium border border-subtle hover:bg-amber-500/10 hover:border-amber-400/40">
            + {d.name}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = destinations.findIndex((d) => d.id === active.id);
        const newIndex = destinations.findIndex((d) => d.id === over.id);
        updateList(arrayMove(destinations, oldIndex, newIndex));
      }}>
        <SortableContext items={destinations.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {destinations.map((dest) => (
              <SortableDestination key={dest.id} dest={dest}
                onChange={(next) => updateList(destinations.map((d) => (d.id === dest.id ? next : d)))}
                onRemove={() => updateList(destinations.filter((d) => d.id !== dest.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!destinations.length && (
        <div className="rounded-2xl border border-dashed border-subtle p-10 text-center text-sm text-content-muted">
          No destinations yet — click a preset or Add
        </div>
      )}
    </div>
  );
}

export function StepItinerary({ b }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black">Day-wise Itinerary</h2>
        <p className="text-sm text-content-muted">Timeline builder with drag, duplicate & images</p>
      </div>
      <TimelineItineraryBuilder itinerary={b.state.itinerary} onChange={b.setItinerary} destination={b.state.destination} />
    </div>
  );
}

function emptyHotel(day = 1) {
  return { day, name: '', category: '4 Star', location: '', roomType: '', mealPlan: MEAL_PLANS[2], checkIn: '', checkOut: '', image: '', alternatives: [] };
}

export function StepHotels({ b }) {
  const hotels = b.state.hotels || [];
  const update = (index, patch) => {
    const next = [...hotels];
    next[index] = { ...next[index], ...patch };
    b.update({ hotels: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black">Hotels</h2>
          <p className="text-sm text-content-muted">Assign hotels with room, meal plan & alternatives</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => b.update({ hotels: [...hotels, emptyHotel(hotels.length + 1)] })}>
          <Plus className="w-4 h-4" /> Add Hotel
        </Button>
      </div>

      <div className="grid gap-4">
        {hotels.map((hotel, index) => (
          <div key={index} className="rounded-2xl border border-subtle bg-white/50 dark:bg-slate-900/30 p-4 space-y-3">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-surface-elevated shrink-0">
                {hotel.image ? <img src={hotel.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImagePlus className="w-6 h-6 opacity-30" /></div>}
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-2">
                <input value={hotel.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Hotel name" className={inputCls('h-9')} />
                <select value={hotel.category} onChange={(e) => update(index, { category: e.target.value })} className={inputCls('h-9')}>
                  {HOTEL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={hotel.location} onChange={(e) => update(index, { location: e.target.value })} placeholder="Location" className={inputCls('h-9')} />
                <input value={hotel.roomType} onChange={(e) => update(index, { roomType: e.target.value })} placeholder="Room type" className={inputCls('h-9')} />
                <select value={hotel.mealPlan} onChange={(e) => update(index, { mealPlan: e.target.value })} className={inputCls('h-9')}>
                  {MEAL_PLANS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="number" min={1} value={hotel.day} onChange={(e) => update(index, { day: Number(e.target.value) })} placeholder="Day" className={inputCls('h-9')} />
              </div>
              <button type="button" onClick={() => b.update({ hotels: hotels.filter((_, i) => i !== index) })} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
            <label className="text-xs inline-flex items-center gap-2 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Upload hotel image
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try { update(index, { image: await readHotelImageFile(file) }); } catch { /* */ }
              }} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function emptyTransport() {
  return { type: 'cab', vehicle: 'SUV', pickup: '', drop: '', distance: '', driver: 'Included', nightCharges: 0, parking: 0, toll: 0, fuel: 0, cost: 0, notes: '' };
}

export function StepTransport({ b }) {
  const items = b.state.transport || [];
  const update = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    b.update({ transport: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black">Transportation</h2>
          <p className="text-sm text-content-muted">Cab, flight, train — pickup, drop & charges</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => b.update({ transport: [...items, emptyTransport()] })}>
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-subtle p-4 grid sm:grid-cols-3 gap-2">
          <select value={item.type} onChange={(e) => update(index, { type: e.target.value })} className={inputCls('h-9')}>
            {TRANSPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input value={item.vehicle} onChange={(e) => update(index, { vehicle: e.target.value })} placeholder="Vehicle" className={inputCls('h-9')} />
          <input value={item.pickup} onChange={(e) => update(index, { pickup: e.target.value })} placeholder="Pickup" className={inputCls('h-9')} />
          <input value={item.drop} onChange={(e) => update(index, { drop: e.target.value })} placeholder="Drop" className={inputCls('h-9')} />
          <input value={item.distance} onChange={(e) => update(index, { distance: e.target.value })} placeholder="Distance" className={inputCls('h-9')} />
          <input type="number" value={item.cost} onChange={(e) => update(index, { cost: Number(e.target.value) })} placeholder="Cost ₹" className={inputCls('h-9')} />
          <button type="button" onClick={() => b.update({ transport: items.filter((_, i) => i !== index) })} className="text-red-500 text-xs sm:col-span-3 text-left">Remove</button>
        </div>
      ))}
    </div>
  );
}

function emptyActivity() {
  return { name: '', description: '', duration: '', included: true, optional: false, extraCost: 0, timing: '', image: '', day: 1 };
}

export function StepActivities({ b }) {
  const items = b.state.activities || [];
  const update = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    b.update({ activities: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black">Activities</h2>
          <p className="text-sm text-content-muted">Included & optional experiences</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => b.update({ activities: [...items, emptyActivity()] })}>
          <Plus className="w-4 h-4" /> Add Activity
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((act, index) => (
          <div key={index} className="rounded-2xl border border-subtle p-4 space-y-2">
            <input value={act.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Activity name" className={inputCls('h-9')} />
            <textarea value={act.description} onChange={(e) => update(index, { description: e.target.value })} placeholder="Description" rows={2} className={inputCls('h-auto py-2 resize-none')} />
            <div className="flex gap-2 text-xs">
              <label className="flex items-center gap-1"><input type="checkbox" checked={act.included} onChange={(e) => update(index, { included: e.target.checked })} /> Included</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={act.optional} onChange={(e) => update(index, { optional: e.target.checked })} /> Optional</label>
            </div>
            <input type="number" value={act.extraCost} onChange={(e) => update(index, { extraCost: Number(e.target.value) })} placeholder="Extra cost" className={inputCls('h-9')} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepMeals({ b }) {
  const meals = b.state.meals || [];
  const update = (index, patch) => {
    const next = [...meals];
    next[index] = { ...next[index], ...patch };
    b.update({ meals: next });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Meals — Day Wise</h2>
      <div className="space-y-3">
        {meals.map((meal, index) => (
          <div key={meal.day} className="rounded-xl border border-subtle p-3">
            <p className="text-xs font-bold text-amber-700 mb-2">Day {meal.day}</p>
            <div className="grid sm:grid-cols-3 gap-2">
              {['breakfast', 'lunch', 'dinner', 'snacks', 'specialDinner'].map((field) => (
                <input key={field} value={meal[field] || ''} onChange={(e) => update(index, { [field]: e.target.value })}
                  placeholder={field.replace(/([A-Z])/g, ' $1')} className={inputCls('h-9 text-xs')} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepPricing({ b }) {
  const p = b.state.pricing || {};
  const fields = [
    ['hotelCost', 'Hotel Cost'], ['cabCost', 'Cab Cost'], ['activityCost', 'Activity Cost'],
    ['mealCost', 'Meal Cost'], ['guideCost', 'Guide Cost'], ['taxes', 'Taxes'],
    ['markup', 'Markup'], ['discount', 'Discount'], ['agentCommission', 'Agent Commission'],
  ];
  const sharing = [
    ['doubleSharing', 'Double Sharing'], ['tripleSharing', 'Triple Sharing'], ['quadSharing', 'Quad Sharing'],
    ['childWithBed', 'Child With Bed'], ['childWithoutBed', 'Child Without Bed'], ['infant', 'Infant'],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">Pricing Engine</h2>
        <p className="text-sm text-content-muted">Live calculation — per person & sharing tiers</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <input type="number" min={0} value={p[key] || 0} onChange={(e) => b.updatePricing({ [key]: Number(e.target.value) })} className={inputCls()} />
          </Field>
        ))}
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-content-muted">Final Package Price</p>
          <p className="text-2xl font-black text-emerald-700">{formatINR(p.finalPrice || 0)}</p>
        </div>
        <div>
          <p className="text-xs text-content-muted">Per Person (2 pax)</p>
          <p className="text-2xl font-black text-sky-700">{formatINR(p.perPerson || 0)}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {sharing.map(([key, label]) => (
          <Field key={key} label={label}>
            <input type="number" min={0} value={p[key] || 0} onChange={(e) => b.updatePricing({ [key]: Number(e.target.value) })} className={inputCls()} />
          </Field>
        ))}
      </div>
    </div>
  );
}

function InclusionStep({ title, presets, items, onChange, onTogglePreset, accent }) {
  const active = cleanInclusionExclusionLines(items);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {presets.map((text) => {
          const on = active.includes(text);
          return (
            <button key={text} type="button" onClick={() => onTogglePreset(text)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border', on ? accent : 'border-subtle hover:bg-white/50')}>
              {on ? '✓ ' : ''}{text}
            </button>
          );
        })}
      </div>
      <InclusionExclusionEditor items={items} onChange={onChange} />
    </div>
  );
}

export function StepInclusions({ b }) {
  return <InclusionStep title="Inclusions" presets={INCLUSION_PRESETS} items={b.state.inclusions} onChange={b.setInclusions} onTogglePreset={b.toggleInclusionPreset} accent="bg-emerald-500/20 border-emerald-500/40 text-emerald-800" />;
}

export function StepExclusions({ b }) {
  return <InclusionStep title="Exclusions" presets={EXCLUSION_PRESETS} items={b.state.exclusions} onChange={b.setExclusions} onTogglePreset={b.toggleExclusionPreset} accent="bg-rose-500/20 border-rose-500/40 text-rose-800" />;
}

export function StepPolicies({ b }) {
  const cp = b.state.cancellationPolicy || {};
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Cancellation Policy</h2>
      <Field label="Policy Content">
        <textarea value={cp.content} onChange={(e) => b.updateNested('cancellationPolicy', { content: e.target.value })} rows={5} className={inputCls('h-auto py-2 resize-none')} />
      </Field>
      <Field label="Refund Rules">
        <textarea value={cp.refundRules} onChange={(e) => b.updateNested('cancellationPolicy', { refundRules: e.target.value })} rows={3} className={inputCls('h-auto py-2 resize-none')} />
      </Field>
    </div>
  );
}

export function StepNotes({ b }) {
  const n = b.state.importantNotes || {};
  const fields = [
    ['travelGuidelines', 'Travel Guidelines'], ['documentsRequired', 'Documents Required'],
    ['packingTips', 'Packing Tips'], ['weather', 'Weather'], ['safety', 'Safety'],
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Important Notes</h2>
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          <textarea value={n[key] || ''} onChange={(e) => b.updateNested('importantNotes', { [key]: e.target.value })} rows={3} className={inputCls('h-auto py-2 resize-none')} />
        </Field>
      ))}
    </div>
  );
}

function CoverImageUpload({ coverImage, onChange, label }) {
  return (
    <Field label={label}>
      <div className="flex gap-3 items-start">
        <div className="w-32 h-24 rounded-xl border border-dashed overflow-hidden bg-surface-elevated">
          {coverImage ? <img src={coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-content-muted text-xs">No image</div>}
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer text-sm">
          <Upload className="w-4 h-4" /> Upload (max 500 KB)
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            try { onChange(await readHotelImageFile(file)); } catch { /* */ }
          }} />
        </label>
      </div>
    </Field>
  );
}

export function StepGallery({ b }) {
  const gallery = b.state.gallery || [];
  const addImages = async (files) => {
    const urls = [];
    for (const file of files) {
      try { urls.push(await readHotelImageFile(file)); } catch { /* skip */ }
    }
    if (urls.length) b.update({ gallery: [...gallery, ...urls] });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Image Gallery</h2>
      <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border-2 border-dashed border-subtle cursor-pointer hover:bg-amber-500/5">
        <Upload className="w-8 h-8 text-amber-600" />
        <span className="text-sm font-medium">Drag & drop or click — max 500 KB each</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages([...e.target.files])} />
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {gallery.map((img, i) => (
          <div key={img} className="relative group aspect-square rounded-xl overflow-hidden border">
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => b.update({ gallery: gallery.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100">×</button>
            {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">Cover</span>}
            <button type="button" onClick={() => b.update({ coverImage: img })} className="absolute bottom-1 right-1 text-[9px] bg-white/90 px-1 rounded opacity-0 group-hover:opacity-100">Set cover</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StepVideos({ b }) {
  const videos = b.state.videos || [];
  const add = () => b.update({ videos: [...videos, { type: 'youtube', url: '', title: '' }] });
  const update = (i, patch) => {
    const next = [...videos];
    next[i] = { ...next[i], ...patch };
    b.update({ videos: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-black">Videos</h2>
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={add}>Add Video</Button>
      </div>
      {videos.map((v, i) => (
        <div key={i} className="grid sm:grid-cols-3 gap-2">
          <select value={v.type} onChange={(e) => update(i, { type: e.target.value })} className={inputCls('h-9')}>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram Reel</option>
            <option value="short">Short Video</option>
          </select>
          <input value={v.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="URL" className={inputCls('h-9')} />
          <input value={v.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Title" className={inputCls('h-9')} />
        </div>
      ))}
    </div>
  );
}

export function StepSeo({ b }) {
  const seo = b.state.seo || {};
  const fields = [
    ['metaTitle', 'Meta Title'], ['metaDescription', 'Meta Description'],
    ['keywords', 'Keywords'], ['canonicalUrl', 'Canonical URL'],
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">SEO</h2>
      {fields.map(([key, label]) => (
        <Field key={key} label={label}>
          {key === 'metaDescription' ? (
            <textarea value={seo[key] || ''} onChange={(e) => b.updateNested('seo', { [key]: e.target.value })} rows={3} className={inputCls('h-auto py-2 resize-none')} />
          ) : (
            <input value={seo[key] || ''} onChange={(e) => b.updateNested('seo', { [key]: e.target.value })} className={inputCls()} />
          )}
        </Field>
      ))}
      <CoverImageUpload coverImage={seo.ogImage} onChange={(url) => b.updateNested('seo', { ogImage: url })} label="OG Image" />
    </div>
  );
}

export function StepTags({ b }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Package Tags</h2>
      <div className="flex flex-wrap gap-2">
        {PACKAGE_TAG_OPTIONS.map((tag) => (
          <button key={tag} type="button" onClick={() => b.toggleTag(tag)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', b.state.tags.includes(tag) ? 'bg-indigo-500 text-white border-indigo-500' : 'border-subtle hover:bg-indigo-500/10')}>
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepFeatures({ b }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Package Features</h2>
      <div className="grid sm:grid-cols-2 gap-2">
        {PACKAGE_FEATURE_OPTIONS.map((f) => (
          <button key={f.key} type="button" onClick={() => b.toggleFeature(f.key)}
            className={cn('p-4 rounded-xl border text-left text-sm font-semibold transition-all', b.state.features[f.key] ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800' : 'border-subtle hover:bg-white/50')}>
            {b.state.features[f.key] ? '✓ ' : ''}{f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepPreview({ b, previewMode, setPreviewMode }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black">Live Preview</h2>
        <div className="flex gap-1 p-1 rounded-xl bg-surface-elevated border">
          {['desktop', 'tablet', 'mobile'].map((mode) => (
            <button key={mode} type="button" onClick={() => setPreviewMode(mode)}
              className={cn('px-3 py-1 rounded-lg text-xs font-semibold capitalize', previewMode === mode ? 'bg-amber-500 text-white' : 'text-content-muted')}>
              {mode}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-content-muted">Brochure preview — use sticky panel on the right for live updates</p>
    </div>
  );
}

export function StepPublish({ b }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black">Save & Publish</h2>
      <p className="text-sm text-content-muted">Draft, publish, or archive this package. Sales team can use it in quotations with one click.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="rounded-xl h-12" disabled={b.saving} onClick={() => b.save('draft')}>Save as Draft</Button>
        <Button type="button" variant="amber" className="rounded-xl h-12" disabled={b.saving} onClick={() => b.publish('published')}>Publish Package</Button>
        <Button type="button" variant="outline" className="rounded-xl h-12" disabled={b.saving} onClick={() => b.publish('hidden')}>Save as Hidden</Button>
        <Button type="button" variant="outline" className="rounded-xl h-12" disabled={b.saving} onClick={() => b.saveVersion()}>Save Version Snapshot</Button>
      </div>

      {b.versions?.length > 0 && (
        <div className="rounded-xl border border-subtle p-4 space-y-2">
          <p className="text-xs font-bold uppercase text-content-muted">Version History</p>
          {b.versions.map((v) => (
            <div key={v._id} className="flex justify-between items-center text-sm">
              <span>{v.label || new Date(v.savedAt).toLocaleString()}</span>
              <button type="button" onClick={() => b.restoreVersion(v._id)} className="text-sky-600 text-xs font-semibold hover:underline">Restore</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
