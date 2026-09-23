import { IndianRupee, StickyNote } from 'lucide-react';
import GlassCard from '../quotations/builder/GlassCard';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn('input-premium w-full rounded-xl text-sm', extra);
}

/**
 * Single package total — hotel/cab Option 1 vs Option 2 prices live on Hotels & Transport steps.
 */
export default function SimplifiedPricingSection({
  totalCost,
  internalNotes,
  onTotalChange,
  onOptionsChange,
  onNotesChange,
  pricingOptions,
}) {
  // Support both legacy dual-package callbacks and simple total
  const handleTotal = (value) => {
    const amount = Math.max(0, Number(value) || 0);
    if (typeof onTotalChange === 'function') onTotalChange(amount);
    if (typeof onOptionsChange === 'function') {
      const base = Array.isArray(pricingOptions) && pricingOptions[0]
        ? pricingOptions[0]
        : { label: 'Price 1', hotelCost: 0, cabCost: 0, total: 0 };
      onOptionsChange([
        { ...base, label: 'Price 1', total: amount },
        { label: 'Price 2', hotelCost: 0, cabCost: 0, total: 0 },
      ]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Package Total</h2>
        <p className="text-sm text-slate-500">
          Final quote total. Hotel / Cab ke Option 1 &amp; Option 2 prices Hotels &amp; Transport steps pe set karo —
          client wahan se ek choose karega.
        </p>
      </div>

      <GlassCard className="p-6 sm:p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
        <label className="text-xs font-bold uppercase tracking-wider text-content-muted flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-emerald-600" />
          Total Package Cost
        </label>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-3xl font-black text-content-muted">₹</span>
          <input
            type="number"
            min={0}
            value={totalCost || ''}
            onChange={(e) => handleTotal(e.target.value)}
            className={cn(inputCls('h-14 text-3xl font-black text-emerald-700'), 'border-emerald-500/30')}
            placeholder="0"
          />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <label className="text-xs font-bold uppercase tracking-wider text-content-muted flex items-center gap-2 mb-2">
          <StickyNote className="w-4 h-4" />
          Internal Notes (optional)
        </label>
        <textarea
          value={internalNotes || ''}
          onChange={(e) => onNotesChange?.(e.target.value)}
          rows={4}
          className={inputCls('h-auto py-3 resize-none')}
          placeholder="Agent-only notes — not shown on customer PDF"
        />
      </GlassCard>
    </div>
  );
}
