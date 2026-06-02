import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { AGENTS, DESTINATIONS, LEAD_STATUSES, TRAVEL_MONTHS } from './constants';
import { LEAD_SOURCE_FILTER_OPTIONS } from '../../lib/leadSourceLabels';

export default function LeadFilterBar({ filters, onChange, onApply, onReset, activeCount = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="sticky top-16 z-20 mb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-surface-app/95 backdrop-blur-md border-y border-subtle">
      <div className="max-w-[1600px] mx-auto">
        {/* Primary row */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <input
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Search customer, phone, email..."
              className="input-premium pl-10 h-10 rounded-xl"
            />
          </div>
          <select value={filters.status} onChange={(e) => set('status', e.target.value)} className="input-premium h-10 rounded-xl lg:w-40">
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={filters.destination} onChange={(e) => set('destination', e.target.value)} className="input-premium h-10 rounded-xl lg:w-36">
            <option value="">Destination</option>
            {DESTINATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button onClick={onApply} size="sm" className="rounded-xl h-10 px-4 flex-1 lg:flex-none">
              Apply
            </Button>
            <Button onClick={() => setExpanded(!expanded)} variant="outline" size="sm" className="rounded-xl h-10 gap-1">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">More</span>
              {activeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-brand-600 text-white rounded-full">{activeCount}</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
            <Button onClick={onReset} variant="ghost" size="sm" className="rounded-xl h-10" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-3 mt-3 border-t border-subtle">
                <select value={filters.source} onChange={(e) => set('source', e.target.value)} className="input-premium h-10 rounded-xl text-sm">
                  <option value="">Lead Source</option>
                  {LEAD_SOURCE_FILTER_OPTIONS.filter((s) => s.value).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select value={filters.agent} onChange={(e) => set('agent', e.target.value)} className="input-premium h-10 rounded-xl text-sm">
                  <option value="">Assigned Agent</option>
                  {AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select value={filters.travelMonth} onChange={(e) => set('travelMonth', e.target.value)} className="input-premium h-10 rounded-xl text-sm">
                  <option value="">Travel Month</option>
                  {TRAVEL_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <input type="number" placeholder="Min Budget ₹" value={filters.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} className="input-premium h-10 rounded-xl text-sm" />
                <input type="number" placeholder="Max Budget ₹" value={filters.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} className="input-premium h-10 rounded-xl text-sm" />
                <input type="date" value={filters.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} className="input-premium h-10 rounded-xl text-sm" title="From date" />
                <input type="date" value={filters.dateTo} onChange={(e) => set('dateTo', e.target.value)} className="input-premium h-10 rounded-xl text-sm" title="To date" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
