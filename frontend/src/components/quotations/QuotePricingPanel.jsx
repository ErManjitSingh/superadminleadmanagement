import { calculatePricing, formatINR } from './quotationUtils';

const FIELDS = [
  { key: 'baseCost', label: 'Base Cost', color: 'border-slate-400/30 bg-slate-500/5' },
  { key: 'hotelCost', label: 'Hotel Cost', color: 'border-amber-400/30 bg-amber-500/5' },
  { key: 'cabCost', label: 'Cab Cost', color: 'border-emerald-400/30 bg-emerald-500/5' },
  { key: 'flightCost', label: 'Flight Cost', color: 'border-sky-400/30 bg-sky-500/5' },
  { key: 'activityCost', label: 'Activities', color: 'border-indigo-400/30 bg-indigo-500/5' },
  { key: 'taxes', label: 'Taxes & Fees', color: 'border-violet-400/30 bg-violet-500/5' },
  { key: 'markup', label: 'Markup', color: 'border-green-400/30 bg-green-500/5' },
  { key: 'discount', label: 'Discount', color: 'border-red-400/30 bg-red-500/5' },
];

export default function QuotePricingPanel({ pricing, onChange, readOnly = false }) {
  const computed = calculatePricing(pricing);

  const update = (key, val) => {
    const next = { ...pricing, [key]: Number(val) || 0 };
    const calc = calculatePricing(next);
    onChange?.({ ...next, total: calc.total, profitMargin: calc.profitMargin });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {FIELDS.map(({ key, label, color }) => (
          <div key={key} className={`p-3 rounded-xl border ${color}`}>
            <label className="text-[10px] uppercase font-semibold text-content-muted">{label}</label>
            {readOnly ? (
              <p className="text-lg font-bold text-content-primary metric-tabular mt-1">{formatINR(pricing[key])}</p>
            ) : (
              <input
                type="number"
                min={0}
                value={pricing[key] || ''}
                onChange={(e) => update(key, e.target.value)}
                className="input-premium w-full h-10 rounded-lg text-sm font-bold metric-tabular mt-1"
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-brand-400/30 bg-gradient-to-br from-brand-500/15 to-indigo-500/10">
          <p className="text-xs font-semibold uppercase text-brand-600">Total Quote Amount</p>
          <p className="text-3xl font-black text-brand-700 dark:text-brand-300 metric-tabular mt-1">{formatINR(computed.total)}</p>
        </div>
        <div className="p-5 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-teal-500/10">
          <p className="text-xs font-semibold uppercase text-emerald-600">Profit Margin</p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 metric-tabular mt-1">{computed.profitMargin}%</p>
        </div>
      </div>
    </div>
  );
}
