import { useMemo, useState } from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';

export default function LeadBranchTransferModal({
  open,
  lead,
  branches,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [branchId, setBranchId] = useState('');
  const options = useMemo(() => branches || [], [branches]);

  const handleClose = () => {
    setBranchId('');
    onClose?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!branchId || !lead?._id) return;
    onSubmit?.({ leadId: lead._id, branchId });
  };

  return (
    <AppModal open={open} onClose={handleClose} size="sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-base font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-fuchsia-600" />
            Transfer Lead Branch
          </h2>
          <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-elevated">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-subtle bg-surface-elevated/40 p-3">
            <p className="text-sm font-semibold text-content-primary">{lead?.name || 'Lead'}</p>
            <p className="text-xs text-content-muted">{lead?.destination || '—'}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-2">
              Select Target Branch
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="input-premium w-full h-11 rounded-xl"
            >
              <option value="">Choose branch</option>
              {options.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!branchId || submitting}>
              Transfer
            </Button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}
