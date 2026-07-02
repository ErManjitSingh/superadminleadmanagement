import { IndianRupee, StickyNote } from 'lucide-react';
import GlassCard from '../quotations/builder/GlassCard';
import { cn } from '../../lib/utils';

function inputCls(extra = '') {
  return cn('input-premium w-full rounded-xl text-sm', extra);
}

export default function SimplifiedPricingSection({ totalCost, internalNotes, onTotalChange, onNotesChange }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">Pricing</h2>
        <p className="text-sm text-content-muted">One total — no complex breakdown needed</p>
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
            onChange={(e) => onTotalChange(Number(e.target.value) || 0)}
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
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className={inputCls('h-auto py-3 resize-none')}
          placeholder="Agent-only notes — not shown on customer PDF"
        />
      </GlassCard>
    </div>
  );
}
