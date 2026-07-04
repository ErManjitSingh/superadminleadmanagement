import {
  Bot,
  Building2,
  Car,
  Check,
  Eye,
  HelpCircle,
  IndianRupee,
  Package,
} from 'lucide-react';
import { BUILDER_STEPS } from './builderConstants';
import { cn } from '../../../lib/utils';

const STEP_ICONS = {
  1: Package,
  2: Bot,
  3: Building2,
  4: Car,
  5: IndianRupee,
  6: Eye,
};

export default function PackageSummaryPanel({
  step,
  packageInfo = {},
  lead = null,
  itinerary = [],
  builderUi = {},
  hiddenStepIds = [],
  onStepChange,
  maxReached = 1,
}) {
  const steps = BUILDER_STEPS.filter((s) => !hiddenStepIds.includes(s.id));
  const days = Number(packageInfo.duration) || 0;
  const nights = Math.max(0, days - 1);
  const adults = Number(packageInfo.adults) || 0;
  const children = Number(packageInfo.children) || 0;
  const travelers = adults + children;

  const hotelDone =
    builderUi.skipHotel ||
    (builderUi.hotelMode === 'same'
      ? Boolean(builderUi.sameHotel?.name?.trim())
      : (builderUi.destinationHotels || []).some((h) => h.name?.trim()));

  const transportDone =
    builderUi.transportMode === 'manual'
      ? Boolean(builderUi.manualTransport?.vehicleName?.trim())
      : Boolean(builderUi.fleetVehicle);

  const checklistDone = {
    1: Boolean(packageInfo.packageName || packageInfo.destination),
    2: itinerary.length > 0,
    3: hotelDone,
    4: transportDone,
    5: Number(packageInfo.total || 0) > 0 || step > 5,
    6: step >= 6,
  };

  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Package Summary</h3>

        <div className="space-y-3 text-sm">
          <SummaryRow
            label="Package Name"
            value={packageInfo.packageName || '—'}
          />
          <SummaryRow
            label="Duration"
            value={days ? `${nights} Nights / ${days} Days` : '—'}
          />
          <SummaryRow
            label="Travelers"
            value={
              travelers
                ? `${adults} Adult${adults === 1 ? '' : 's'}${children ? `, ${children} Child` : ''}`
                : lead?.name || '—'
            }
          />
          {packageInfo.destination && (
            <SummaryRow label="Destination" value={packageInfo.destination} />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Progress</h3>
        <ul className="space-y-1">
          {steps.map((s) => {
            const Icon = STEP_ICONS[s.id] || Package;
            const done = s.id < step || checklistDone[s.id];
            const active = s.id === step;
            const reachable = s.id <= maxReached;

            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && onStepChange?.(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all',
                    active && 'bg-violet-50 ring-1 ring-violet-200',
                    !active && reachable && 'hover:bg-slate-50',
                    !reachable && 'opacity-45 cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      done && !active && 'bg-emerald-500 text-white',
                      active && 'bg-violet-600 text-white',
                      !done && !active && 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {done && !active ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      active && 'text-violet-800',
                      done && !active && 'text-emerald-700',
                      !done && !active && 'text-slate-500',
                    )}
                  >
                    {s.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Need Help?</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Stuck on a step? Our team can guide you through the quotation.
            </p>
            <a
              href="mailto:support@indiaholidaydestination.com"
              className="inline-block mt-2 text-xs font-bold text-violet-700 hover:text-violet-800"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-semibold tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{value}</p>
    </div>
  );
}
