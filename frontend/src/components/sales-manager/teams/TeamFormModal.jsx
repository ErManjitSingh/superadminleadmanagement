import { X, UsersRound } from 'lucide-react';
import { Button } from '../../ui/button';
import AppModal from '../../ui/AppModal';

export default function TeamFormModal({ open, team, leaders, onClose, onSave }) {
  const isEdit = !!team?._id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave({
      name: fd.get('name'),
      description: fd.get('description'),
      teamLeaderId: fd.get('teamLeaderId'),
    });
  };

  return (
    <AppModal open={open} onClose={onClose} size="lg" className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-violet-600" />
            {isEdit ? 'Edit Team' : 'Create Team'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">Team Name *</label>
            <input name="name" required defaultValue={team?.name} placeholder="e.g. Alpha Squad" className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">Team Leader *</label>
            <select name="teamLeaderId" required defaultValue={team?.teamLeader?._id} className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30">
              <option value="">Select team leader…</option>
              {leaders.map((l) => (
                <option key={l._id} value={l._id}>{l.name} · {l.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">Team Description</label>
            <textarea name="description" rows={3} defaultValue={team?.description} placeholder="Team focus, destinations, segment…" className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Team'}</Button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}
