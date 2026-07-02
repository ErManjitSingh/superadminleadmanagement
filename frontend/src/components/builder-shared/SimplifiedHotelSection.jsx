import { Plus, Trash2, Building2, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import GlassCard from '../quotations/builder/GlassCard';
import { MEAL_PLANS } from '../quotations/constants';
import { ROOM_TYPES } from './fleetConstants';
import { emptyDestinationHotel } from './builderUiUtils';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn('input-premium w-full h-10 rounded-xl text-sm', extra);
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold text-content-muted tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function HotelFields({ hotel, onChange }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field label="Hotel Name" className="sm:col-span-2">
        <input
          value={hotel.name}
          onChange={(e) => onChange({ ...hotel, name: e.target.value })}
          className={inputCls()}
          placeholder="Hotel Snow View"
        />
      </Field>
      <Field label="Check In">
        <input
          type="date"
          value={hotel.checkIn?.slice?.(0, 10) || hotel.checkIn || ''}
          onChange={(e) => onChange({ ...hotel, checkIn: e.target.value })}
          className={inputCls()}
        />
      </Field>
      <Field label="Check Out">
        <input
          type="date"
          value={hotel.checkOut?.slice?.(0, 10) || hotel.checkOut || ''}
          onChange={(e) => onChange({ ...hotel, checkOut: e.target.value })}
          className={inputCls()}
        />
      </Field>
      <Field label="Room Type">
        <select
          value={hotel.roomType}
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
          value={hotel.mealPlan}
          onChange={(e) => onChange({ ...hotel, mealPlan: e.target.value })}
          className={inputCls()}
        >
          {MEAL_PLANS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

export default function SimplifiedHotelSection({ builderUi, onChange, destinations = [] }) {
  const update = (patch) => onChange({ ...builderUi, ...patch });

  if (builderUi.skipHotel) {
    return (
      <div className="space-y-4">
        <Header skipHotel onToggleSkip={() => update({ skipHotel: false })} />
        <GlassCard className="p-8 text-center border-dashed">
          <Building2 className="w-10 h-10 mx-auto text-content-muted/40 mb-2" />
          <p className="text-sm text-content-muted">Hotel section skipped — transport only or land-only package</p>
          <Button type="button" variant="outline" className="rounded-xl mt-4" onClick={() => update({ skipHotel: false })}>
            Add Hotels
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header skipHotel={false} onToggleSkip={() => update({ skipHotel: true })} />

      <div className="flex flex-wrap gap-2">
        <ModeButton
          active={builderUi.hotelMode === 'same'}
          onClick={() => update({ hotelMode: 'same' })}
          label="Same Hotel for Entire Trip"
        />
        <ModeButton
          active={builderUi.hotelMode === 'per_destination'}
          onClick={() => update({
            hotelMode: 'per_destination',
            destinationHotels: builderUi.destinationHotels?.length
              ? builderUi.destinationHotels
              : [emptyDestinationHotel(destinations[0]?.name || 'Shimla')],
          })}
          label="Different Hotel Every Destination"
        />
      </div>

      {builderUi.hotelMode === 'same' ? (
        <GlassCard className="p-5">
          <HotelFields
            hotel={builderUi.sameHotel}
            onChange={(sameHotel) => update({ sameHotel })}
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {(builderUi.destinationHotels || []).map((hotel, index) => (
            <GlassCard key={hotel.id} className="p-5 relative">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-sky-700">
                  <MapPin className="w-4 h-4" />
                  <input
                    value={hotel.destination}
                    onChange={(e) => {
                      const next = [...builderUi.destinationHotels];
                      next[index] = { ...hotel, destination: e.target.value };
                      update({ destinationHotels: next });
                    }}
                    className={cn(inputCls('h-9 max-w-[200px]'), 'font-bold')}
                    placeholder="Destination"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => update({
                    destinationHotels: builderUi.destinationHotels.filter((_, i) => i !== index),
                  })}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
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
            </GlassCard>
          ))}
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
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
    </div>
  );
}

function Header({ skipHotel, onToggleSkip }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-black">Hotels</h2>
        <p className="text-sm text-content-muted">Optional — skip if not including accommodation</p>
      </div>
      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-subtle bg-white/50 cursor-pointer text-sm font-medium">
        <input type="checkbox" checked={skipHotel} onChange={onToggleSkip} className="rounded" />
        Skip Hotel
      </label>
    </div>
  );
}

function ModeButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
        active
          ? 'bg-sky-500/15 border-sky-500/40 text-sky-800 ring-2 ring-sky-500/20'
          : 'border-subtle hover:bg-white/60'
      )}
    >
      {label}
    </button>
  );
}
