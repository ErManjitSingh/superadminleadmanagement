import { motion } from 'framer-motion';
import { Plus, List, Calendar, History } from 'lucide-react';
import { Button } from '../ui/button';

const views = [
  { id: 'list', label: 'List', icon: List },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: History },
];

export default function FollowUpHeader({ total, view, onViewChange, onAdd, canCreate = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">Follow-up Management</h1>
          <span className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 text-sm font-bold metric-tabular">{total}</span>
        </div>
        <p className="text-sm text-content-muted">HubSpot-style tasks — schedule, track & convert</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-subtle bg-surface p-1">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  view === v.id ? 'bg-violet-600 text-white shadow-sm' : 'text-content-muted hover:text-content-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {v.label}
              </button>
            );
          })}
        </div>
        {canCreate && (
          <Button onClick={onAdd} size="sm" variant="violet" className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Follow-up
          </Button>
        )}
      </div>
    </motion.div>
  );
}
