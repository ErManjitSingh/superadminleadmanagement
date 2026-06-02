import { X, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import AppModal from '../ui/AppModal';

export default function AssignLeadModal({ open, lead, executives, onClose, onAssign }) {
  const isBulk = lead?.bulk;
  const isLostLead = ['lost', 'booked_from_another_company'].includes(lead?.status);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const executiveId = fd.get('executiveId');
    onAssign({
      executiveId,
      leadIds: isBulk ? undefined : [lead._id],
    });
  };

  return (
    <AppModal open={open} onClose={onClose} size="md" className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-violet-600" />
            {isBulk ? `Assign ${lead?.count} Leads` : (isLostLead ? 'Reassign Lost Lead' : (lead?.assignedTo ? 'Reassign Lead' : 'Assign Lead'))}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {!isBulk && lead && (
            <div className="p-3 rounded-xl bg-surface-elevated/50 border border-subtle text-sm">
              <p className="font-semibold text-content-primary">{lead.name}</p>
              <p className="text-content-muted">{lead.destination} · {lead.sourceLabel}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">Assign to Executive</label>
            <select name="executiveId" required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30">
              <option value="">Select executive…</option>
              {executives.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name} · {ex.leads ?? ex.assignedLeads ?? 0} leads</option>
              ))}
            </select>
            {!executives.length && (
              <p className="text-xs text-amber-600 mt-2">No active executives found. Add a Sales Executive user in Team Management.</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!executives.length}>Confirm Assignment</Button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}
