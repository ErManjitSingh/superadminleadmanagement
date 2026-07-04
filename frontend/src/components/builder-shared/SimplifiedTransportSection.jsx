import { useMemo, useState } from 'react';
import {
  Briefcase,
  Car,
  Check,
  PenLine,
  Search,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import {
  FLEET_CATEGORIES,
  VEHICLE_COUNT_OPTIONS,
  getVehicleMeta,
  mergeFleetWithCabs,
} from './fleetConstants';
import { formatINR } from '../quotations/quotationUtils';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn(
    'w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400',
    extra,
  );
}

export default function SimplifiedTransportSection({ builderUi, onChange, cabs = [] }) {
  const fleet = mergeFleetWithCabs(cabs);
  const update = (patch) => onChange({ ...builderUi, ...patch });
  const category = builderUi.fleetCategory || 'Sedan';
  const [search, setSearch] = useState('');
  const [customCount, setCustomCount] = useState(false);

  const vehicles = fleet[category] || [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((name) => name.toLowerCase().includes(q));
  }, [vehicles, search]);

  const count = Number(builderUi.vehicleCount) || 1;
  const perVehicle = Number(builderUi.perVehicleCost) || 0;
  const total =
    builderUi.transportMode === 'manual'
      ? Number(builderUi.manualTransport?.price) || 0
      : perVehicle * count;

  const isCustomCount = customCount || !VEHICLE_COUNT_OPTIONS.includes(count);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Transport</h2>
        <p className="text-sm text-slate-500 mt-0.5">Select from fleet or enter a custom vehicle</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ModeTab
          active={builderUi.transportMode !== 'manual'}
          onClick={() => update({ transportMode: 'fleet' })}
          icon={Truck}
          label="Select From Fleet"
        />
        <ModeTab
          active={builderUi.transportMode === 'manual'}
          onClick={() => update({ transportMode: 'manual' })}
          icon={PenLine}
          label="Manual Entry"
        />
      </div>

      {builderUi.transportMode !== 'manual' ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Vehicle Type</label>
              <select
                value={category}
                onChange={(e) => {
                  const fleetCategory = e.target.value;
                  const list = fleet[fleetCategory] || [];
                  update({
                    fleetCategory,
                    fleetVehicle: list[0] || '',
                  });
                  setSearch('');
                }}
                className={cn(inputCls(), 'mt-1.5')}
              >
                {FLEET_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Search</label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={inputCls('pl-10')}
                  placeholder="Search vehicle..."
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((name) => {
              const selected = builderUi.fleetVehicle === name;
              const meta = getVehicleMeta(name, category);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => update({ fleetVehicle: name })}
                  className={cn(
                    'relative text-left rounded-2xl border-2 bg-white p-4 transition-all',
                    selected
                      ? 'border-violet-500 shadow-md shadow-violet-500/15 ring-2 ring-violet-500/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
                  )}
                >
                  {selected && (
                    <span className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{category}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-violet-500" />
                          {meta.seats} Seats
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-violet-500" />
                          {meta.bags} Bags
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!filtered.length && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No vehicles found — try another type or use Manual Entry
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Vehicle Name</label>
            <input
              value={builderUi.manualTransport?.vehicleName || ''}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, vehicleName: e.target.value },
              })}
              className={cn(inputCls(), 'mt-1.5')}
              placeholder="Custom vehicle"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Vehicle Type</label>
            <select
              value={builderUi.manualTransport?.vehicleType || 'Sedan'}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, vehicleType: e.target.value },
              })}
              className={cn(inputCls(), 'mt-1.5')}
            >
              {FLEET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Price (total)</label>
            <input
              type="number"
              min={0}
              value={builderUi.manualTransport?.price || ''}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, price: Number(e.target.value) },
                perVehicleCost: Number(e.target.value),
              })}
              className={cn(inputCls(), 'mt-1.5')}
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Notes</label>
            <input
              value={builderUi.manualTransport?.notes || ''}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, notes: e.target.value },
              })}
              className={cn(inputCls(), 'mt-1.5')}
              placeholder="Optional notes"
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-slate-600">Number of Vehicles</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {VEHICLE_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setCustomCount(false);
                  update({ vehicleCount: n });
                }}
                className={cn(
                  'w-11 h-11 rounded-xl font-bold text-sm border-2 transition-all',
                  !isCustomCount && count === n
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/25'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white',
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomCount(true)}
              className={cn(
                'h-11 px-4 rounded-xl font-bold text-sm border-2 transition-all',
                isCustomCount
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white',
              )}
            >
              Custom
            </button>
            {isCustomCount && (
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => update({ vehicleCount: Math.max(1, Number(e.target.value) || 1) })}
                className={inputCls('w-24')}
              />
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {builderUi.transportMode !== 'manual' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Per Vehicle Cost (₹)</label>
              <input
                type="number"
                min={0}
                value={perVehicle || ''}
                onChange={(e) => update({ perVehicleCost: Number(e.target.value) })}
                className={cn(inputCls(), 'mt-1.5')}
                placeholder="2500"
              />
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Transport Total</label>
            <div className="mt-1.5 h-11 rounded-xl border border-violet-200 bg-violet-50 px-3 flex items-center justify-between">
              <span className="text-lg font-bold text-violet-800">{formatINR(total)}</span>
              <ShoppingCart className="w-5 h-5 text-violet-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
        active
          ? 'bg-violet-50 border-violet-500 text-violet-800 shadow-sm shadow-violet-500/10'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50 bg-white',
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
