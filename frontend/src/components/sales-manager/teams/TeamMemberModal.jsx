import { X, UserPlus, UserMinus, ArrowRightLeft, Crown } from 'lucide-react';
import { Button } from '../../ui/button';
import AppModal from '../../ui/AppModal';

const TITLES = {
  add: { icon: UserPlus, title: 'Add Executive', submit: 'Add to Team' },
  remove: { icon: UserMinus, title: 'Remove Executive', submit: 'Remove' },
  transfer: { icon: ArrowRightLeft, title: 'Transfer Executive', submit: 'Transfer' },
  leader: { icon: Crown, title: 'Change Team Leader', submit: 'Update Leader' },
};

export default function TeamMemberModal({
  open, mode, member, team, teams = [], availableExecutives = [], leaders = [], onClose, onConfirm,
}) {
  if (!mode) return null;
  const meta = TITLES[mode];
  const Icon = meta.icon;

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (mode === 'add') onConfirm({ executiveId: fd.get('executiveId') });
    if (mode === 'remove') onConfirm({ executiveId: member?._id });
    if (mode === 'transfer') onConfirm({ executiveId: member?._id, targetTeamId: fd.get('targetTeamId') });
    if (mode === 'leader') onConfirm({ teamLeaderId: fd.get('teamLeaderId') });
  };

  return (
    <AppModal open={open} onClose={onClose} size="md" className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-lg font-bold flex items-center gap-2"><Icon className="w-5 h-5 text-violet-600" /> {meta.title}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {mode === 'add' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">Select Executive</label>
              <select name="executiveId" required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30">
                <option value="">Choose executive…</option>
                {availableExecutives.map((ex) => (
                  <option key={ex._id} value={ex._id}>{ex.name}</option>
                ))}
              </select>
              {availableExecutives.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">All executives are already assigned to teams.</p>
              )}
            </div>
          )}
          {mode === 'remove' && member && (
            <p className="text-sm text-content-secondary">Remove <span className="font-semibold text-content-primary">{member.name}</span> from {team?.name}?</p>
          )}
          {mode === 'transfer' && member && (
            <>
              <p className="text-sm text-content-secondary">Transfer <span className="font-semibold">{member.name}</span> from {team?.name} to:</p>
              <select name="targetTeamId" required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm">
                <option value="">Select target team…</option>
                {teams.filter((t) => t._id !== team?._id).map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </>
          )}
          {mode === 'leader' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">New Team Leader</label>
              <select name="teamLeaderId" required defaultValue={team?.teamLeader?._id} className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm">
                {leaders.map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">{meta.submit}</Button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}
