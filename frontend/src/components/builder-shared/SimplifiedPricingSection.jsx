import { BedDouble, Car, IndianRupee, StickyNote } from 'lucide-react';
import GlassCard from '../quotations/builder/GlassCard';
import { normalizePricingOptions } from '../quotations/quotationUtils';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn('input-premium w-full rounded-xl text-sm', extra);
}

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function PriceOptionCard({ option, index, onChange }) {
  const isPrimary = index === 0;
  const hotel = Number(option.hotelCost) || 0;
  const cab = Number(option.cabCost) || 0;
  const total = Number(option.total) || 0;
  const suggested = hotel + cab;

  const patch = (field, raw) => {
    const value = Math.max(0, Number(raw) || 0);
    const next = { ...option, [field]: value };
    if (field === 'hotelCost' || field === 'cabCost') {
      const prevSum = (Number(option.hotelCost) || 0) + (Number(option.cabCost) || 0);
      const wasAuto = !option.total || Number(option.total) === prevSum;
      if (wasAuto) {
        next.total = (field === 'hotelCost' ? value : hotel) + (field === 'cabCost' ? value : cab);
      }
    }
    onChange(next);
  };

  return (
    <GlassCard
      className={cn(
        'relative overflow-hidden p-4 sm:p-5',
        isPrimary
          ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/25'
          : 'bg-gradient-to-br from-sky-500/10 to-indigo-500/5 border-sky-500/25',
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
          isPrimary ? 'from-emerald-400 to-teal-500' : 'from-sky-400 to-indigo-500',
        )}
      />

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white shadow-md',
              isPrimary ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-sky-500 shadow-sky-500/30',
            )}
          >
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{option.label || `Price ${index + 1}`}</p>
            <p className="text-[11px] text-slate-500">
              {isPrimary ? 'Primary quote for client' : 'Optional alternate — client ko dono dikhenge'}
            </p>
          </div>
        </div>
        {total > 0 && (
          <p
            className={cn(
              'text-lg font-black tabular-nums',
              isPrimary ? 'text-emerald-700' : 'text-sky-700',
            )}
          >
            {formatINR(total)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
            <BedDouble className="w-3.5 h-3.5 text-amber-600" />
            Hotel
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted text-sm font-semibold">₹</span>
            <input
              type="number"
              min={0}
              value={hotel || ''}
              onChange={(e) => patch('hotelCost', e.target.value)}
              className={inputCls('h-11 pl-7 font-semibold')}
              placeholder="0"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-sky-600" />
            Cab
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted text-sm font-semibold">₹</span>
            <input
              type="number"
              min={0}
              value={cab || ''}
              onChange={(e) => patch('cabCost', e.target.value)}
              className={inputCls('h-11 pl-7 font-semibold')}
              placeholder="0"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1.5">
            <IndianRupee className={cn('w-3.5 h-3.5', isPrimary ? 'text-emerald-600' : 'text-sky-600')} />
            Total
          </span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted text-sm font-semibold">₹</span>
            <input
              type="number"
              min={0}
              value={total || ''}
              onChange={(e) => patch('total', e.target.value)}
              className={cn(
                inputCls('h-11 pl-7 font-black'),
                isPrimary ? 'border-emerald-500/30 text-emerald-700' : 'border-sky-500/30 text-sky-700',
              )}
              placeholder={suggested > 0 ? String(suggested) : '0'}
            />
          </div>
        </label>
      </div>

      {hotel + cab > 0 && total !== hotel + cab && (
        <p className="mt-2 text-[11px] text-content-muted">
          Hotel + Cab = {formatINR(hotel + cab)} · Total alag set hai
        </p>
      )}
    </GlassCard>
  );
}

export default function SimplifiedPricingSection({
  pricingOptions,
  totalCost,
  internalNotes,
  onOptionsChange,
  onNotesChange,
}) {
  const options = normalizePricingOptions(pricingOptions, totalCost);

  const updateOption = (index, nextOption) => {
    const next = options.map((o, i) => (i === index ? { ...nextOption, label: o.label } : o));
    onOptionsChange(next);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pricing</h2>
        <p className="text-sm text-slate-500">
          Client ko do quote chahiye? Price 1 aur Price 2 dono bharo — PDF & WhatsApp pe dono jayenge
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {options.map((option, i) => (
          <PriceOptionCard
            key={option.label}
            option={option}
            index={i}
            onChange={(next) => updateOption(i, next)}
          />
        ))}
      </div>

      <GlassCard className="p-5">
        <label className="text-xs font-bold uppercase tracking-wider text-content-muted flex items-center gap-2 mb-2">
          <StickyNote className="w-4 h-4" />
          Internal Notes (optional)
        </label>
        <textarea
          value={internalNotes || ''}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className={inputCls('h-auto py-3 resize-none')}
          placeholder="Agent-only notes — not shown on customer PDF"
        />
      </GlassCard>
    </div>
  );
}
