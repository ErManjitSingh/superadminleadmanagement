import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  Hotel,
  MapPin,
  Moon,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { MEAL_PLANS_WITH_HOTEL } from '../quotations/constants';
import { ROOM_TYPES } from './fleetConstants';
import { emptyDestinationHotel } from './builderUiUtils';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn(
    'w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400',
    extra,
  );
}

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <label className="text-[11px] font-semibold text-slate-600">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function HotelFields({ hotel, onChange }) {
  const nights = nightsBetween(hotel.checkIn, hotel.checkOut);

  const setDates = (patch) => {
    const next = { ...hotel, ...patch };
    const n = nightsBetween(next.checkIn, next.checkOut);
    onChange({ ...next, nights: n });
  };

  return (
    <div className="space-y-4">
      <Field label="Hotel Name">
        <div className="relative">
          <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={hotel.name || ''}
            onChange={(e) => onChange({ ...hotel, name: e.target.value })}
            className={inputCls('pl-10')}
            placeholder="Hotel Snow View"
          />
        </div>
      </Field>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Check In">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={hotel.checkIn?.slice?.(0, 10) || hotel.checkIn || ''}
              onChange={(e) => setDates({ checkIn: e.target.value })}
              className={inputCls('pl-10')}
            />
          </div>
        </Field>
        <Field label="Check Out">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={hotel.checkOut?.slice?.(0, 10) || hotel.checkOut || ''}
              onChange={(e) => setDates({ checkOut: e.target.value })}
              className={inputCls('pl-10')}
            />
          </div>
        </Field>
        <Field label="No. of Nights">
          <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Moon className="w-4 h-4 text-violet-500" />
            {nights > 0 ? `${nights} Night${nights === 1 ? '' : 's'}` : '—'}
          </div>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Room Type">
          <select
            value={hotel.roomType || 'Deluxe'}
            onChange={(e) => onChange({ ...hotel, roomType: e.target.value })}
            className={inputCls()}
          >
            {ROOM_TYPES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Meal Plan">
          <select
            value={hotel.mealPlan || MEAL_PLANS_WITH_HOTEL[2]}
            onChange={(e) => onChange({ ...hotel, mealPlan: e.target.value })}
            className={inputCls()}
          >
            {MEAL_PLANS_WITH_HOTEL.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

const TRUST_BADGES = [
  { icon: BadgeCheck, label: 'Best Price Guarantee' },
  { icon: Clock3, label: 'Flexible Booking' },
  { icon: ShieldCheck, label: 'No Hidden Charges' },
  { icon: Building2, label: '24/7 Support' },
];

export default function SimplifiedHotelSection({ builderUi, onChange, destinations = [] }) {
  const update = (patch) => onChange({ ...builderUi, ...patch });
  const hotelMode = builderUi.hotelMode || 'same';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Hotels</h2>
          <p className="text-sm text-slate-500 mt-0.5">Choose stay options for this package</p>
        </div>
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white cursor-pointer text-sm font-medium text-slate-700 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={!!builderUi.skipHotel}
            onChange={(e) => update({ skipHotel: e.target.checked })}
            className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          Skip Hotel
        </label>
      </div>

      {builderUi.skipHotel ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Hotel section skipped — transport only or land-only package</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl mt-4 border-slate-200"
            onClick={() => update({ skipHotel: false })}
          >
            Add Hotels
          </Button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <ModeCard
              active={hotelMode === 'same'}
              onClick={() => update({ hotelMode: 'same' })}
              icon={Hotel}
              title="Same Hotel for Entire Trip"
              description="One hotel for all nights"
            />
            <ModeCard
              active={hotelMode === 'per_destination'}
              onClick={() => update({
                hotelMode: 'per_destination',
                destinationHotels: builderUi.destinationHotels?.length
                  ? builderUi.destinationHotels
                  : [emptyDestinationHotel(destinations[0]?.name || 'Shimla')],
              })}
              icon={MapPin}
              title="Different Hotel Every Destination"
              description="Separate stay per city"
            />
          </div>

          {hotelMode === 'same' ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
              <HotelFields
                hotel={builderUi.sameHotel || {}}
                onChange={(sameHotel) => update({ sameHotel })}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {(builderUi.destinationHotels || []).map((hotel, index) => (
                <div key={hotel.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm relative">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
                      <MapPin className="w-4 h-4" />
                      <input
                        value={hotel.destination}
                        onChange={(e) => {
                          const next = [...builderUi.destinationHotels];
                          next[index] = { ...hotel, destination: e.target.value };
                          update({ destinationHotels: next });
                        }}
                        className={cn(inputCls('h-10 max-w-[220px]'), 'font-semibold')}
                        placeholder="Destination"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => update({
                        destinationHotels: builderUi.destinationHotels.filter((_, i) => i !== index),
                      })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <HotelFields
                    hotel={hotel}
                    onChange={(next) => {
                      const list = [...builderUi.destinationHotels];
                      list[index] = next;
                      update({ destinationHotels: list });
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl gap-2 border-slate-200"
                onClick={() => update({
                  destinationHotels: [
                    ...(builderUi.destinationHotels || []),
                    emptyDestinationHotel(destinations[destinations.length - 1]?.name || ''),
                  ],
                })}
              >
                <Plus className="w-4 h-4" /> Add Destination Hotel
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-700 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ModeCard({ active, onClick, icon: Icon, title, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left rounded-2xl border-2 p-4 transition-all',
        active
          ? 'border-violet-500 bg-violet-50 shadow-sm shadow-violet-500/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500',
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-bold', active ? 'text-violet-800' : 'text-slate-800')}>
            {title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}
