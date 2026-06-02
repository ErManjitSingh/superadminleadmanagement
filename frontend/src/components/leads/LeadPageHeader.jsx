import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Download, Plus } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Button } from '../ui/button';

export default function LeadPageHeader({ title, total, view, onViewChange }) {
  const { can } = usePermissions();
  const canCreateLead = can('leads', 'create');

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">{title}</h1>
          <span className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 text-sm font-bold metric-tabular">
            {total}
          </span>
        </div>
        <p className="text-sm text-content-muted">Manage, assign, and convert travel leads</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-subtle bg-surface p-1 mr-1">
          {[
            { id: 'table', label: 'Table' },
            { id: 'kanban', label: 'Kanban' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                view === v.id ? 'bg-brand-600 text-white shadow-sm' : 'text-content-muted hover:text-content-primary'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="rounded-xl gap-2 hidden sm:inline-flex">
          <Upload className="w-4 h-4" /> Import
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-2 hidden sm:inline-flex">
          <Download className="w-4 h-4" /> Export
        </Button>
        {canCreateLead && (
          <Link to="/leads/new">
            <Button size="sm" className="rounded-xl gap-2 shadow-md shadow-brand-600/20">
              <Plus className="w-4 h-4" /> Add Lead
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
