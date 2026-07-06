import { useState } from 'react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import LeadStatusBadge from './LeadStatusBadge';
import { LEAD_STATUSES } from './constants';

export default function BulkStatusModal({ open, onClose, count, onSubmit }) {
  const [status, setStatus] = useState('contacted');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(status);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-content-primary">Bulk Update Status</h3>
          <p className="text-sm text-content-secondary mt-1">
            Update status for {count} selected lead{count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {LEAD_STATUSES.filter((s) => s.value !== 'converted').map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                status === s.value
                  ? 'border-brand-500 bg-brand-500/5 ring-1 ring-brand-500/30'
                  : 'border-strong hover:bg-surface-secondary'
              }`}
            >
              <LeadStatusBadge status={s.value} />
              {status === s.value && <span className="text-brand-600 text-xs font-medium">Selected</span>}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="default" disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
}
