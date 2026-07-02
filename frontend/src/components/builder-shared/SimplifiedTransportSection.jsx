import { Car, PenLine, Truck } from 'lucide-react';
import GlassCard from '../quotations/builder/GlassCard';
import { FLEET_CATEGORIES, VEHICLE_COUNT_OPTIONS, mergeFleetWithCabs } from './fleetConstants';
import { formatINR } from '../quotations/quotationUtils';
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

export default function SimplifiedTransportSection({ builderUi, onChange, cabs = [] }) {
  const fleet = mergeFleetWithCabs(cabs);
  const update = (patch) => onChange({ ...builderUi, ...patch });
  const category = builderUi.fleetCategory || 'SUV';
  const vehicles = fleet[category] || [];
  const count = Number(builderUi.vehicleCount) || 1;
  const perVehicle = Number(builderUi.perVehicleCost) || 0;
  const total = perVehicle * count;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">Transport</h2>
        <p className="text-sm text-content-muted">Select from fleet or enter a custom vehicle</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ModeTab
          active={builderUi.transportMode === 'fleet'}
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

      {builderUi.transportMode === 'fleet' ? (
        <GlassCard className="p-5 space-y-4">
          <Field label="Vehicle Type">
            <select
              value={category}
              onChange={(e) => update({ fleetCategory: e.target.value, fleetVehicle: '' })}
              className={inputCls()}
            >
              {FLEET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Select Vehicle">
            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {vehicles.map((name) => {
                const selected = builderUi.fleetVehicle === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => update({ fleetVehicle: name })}
                    className={cn(
                      'p-3 rounded-xl border text-left text-sm font-medium transition-all',
                      selected
                        ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                        : 'border-subtle hover:bg-white/50'
                    )}
                  >
                    <Car className="w-4 h-4 mb-1 text-content-muted" />
                    {name}
                  </button>
                );
              })}
            </div>
            {!vehicles.length && (
              <p className="text-xs text-amber-600">No vehicles in fleet — add cabs in Resources or use Manual Entry</p>
            )}
          </Field>
        </GlassCard>
      ) : (
        <GlassCard className="p-5 grid sm:grid-cols-2 gap-3">
          <Field label="Vehicle Name">
            <input
              value={builderUi.manualTransport?.vehicleName || ''}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, vehicleName: e.target.value },
              })}
              className={inputCls()}
              placeholder="Custom vehicle"
            />
          </Field>
          <Field label="Vehicle Type">
            <select
              value={builderUi.manualTransport?.vehicleType || 'SUV'}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, vehicleType: e.target.value },
              })}
              className={inputCls()}
            >
              {FLEET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Price (total)">
            <input
              type="number"
              min={0}
              value={builderUi.manualTransport?.price || ''}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, price: Number(e.target.value) },
                perVehicleCost: Number(e.target.value),
              })}
              className={inputCls()}
            />
          </Field>
          <Field label="Notes">
            <input
              value={builderUi.manualTransport?.notes || ''}
              onChange={(e) => update({
                manualTransport: { ...builderUi.manualTransport, notes: e.target.value },
              })}
              className={inputCls()}
              placeholder="Optional notes"
            />
          </Field>
        </GlassCard>
      )}

      <GlassCard className="p-5 grid sm:grid-cols-3 gap-4">
        <Field label="Number of Vehicles">
          <div className="flex flex-wrap gap-2">
            {VEHICLE_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ vehicleCount: n })}
                className={cn(
                  'w-10 h-10 rounded-xl font-bold text-sm border transition-all',
                  count === n
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-subtle hover:bg-white/60'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        {builderUi.transportMode === 'fleet' && (
          <Field label="Per Vehicle Cost (₹)">
            <input
              type="number"
              min={0}
              value={perVehicle || ''}
              onChange={(e) => update({ perVehicleCost: Number(e.target.value) })}
              className={inputCls()}
            />
          </Field>
        )}
        <Field label="Transport Total">
          <p className="text-2xl font-black text-emerald-700 pt-2">{formatINR(total)}</p>
        </Field>
      </GlassCard>
    </div>
  );
}

function ModeTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
        active
          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 ring-2 ring-emerald-500/20'
          : 'border-subtle hover:bg-white/60'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
