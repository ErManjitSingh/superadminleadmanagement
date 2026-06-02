import { X, UserPlus, Crown, Users, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import Avatar from '../../ui/Avatar';
import AppModal from '../../ui/AppModal';

export default function AssignTeamLeadModal({ open, lead, teams, onClose, onAssign }) {
  const [step, setStep] = useState(1);
  const [teamId, setTeamId] = useState('');
  const isBulk = lead?.bulk;

  const selectedTeam = teams.find((t) => t._id === teamId);

  const handleClose = () => {
    setStep(1);
    setTeamId('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const executiveId = fd.get('executiveId');
    onAssign({
      assigneeRole: 'sales_executive',
      assigneeId: executiveId,
      leadIds: isBulk ? undefined : [lead._id],
    });
    setStep(1);
    setTeamId('');
  };

  const assignToTeamLeader = () => {
    if (!selectedTeam?.teamLeader?._id) return;
    onAssign({
      assigneeRole: 'team_leader',
      assigneeId: selectedTeam.teamLeader._id,
      leadIds: isBulk ? undefined : [lead._id],
    });
    setStep(1);
    setTeamId('');
  };

  return (
    <AppModal open={open} onClose={handleClose} size="md" className="overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-violet-600" />
            {isBulk ? `Assign ${lead?.count} Leads` : 'Assign via Team'}
          </h2>
          <button type="button" onClick={handleClose} className="p-2 rounded-xl hover:bg-surface-elevated"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-content-muted mb-4">
            {['Team', 'Leader', 'Executive'].map((label, i) => (
              <span key={label} className={`flex items-center gap-1 ${step > i ? 'text-violet-600' : ''}`}>
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step > i ? 'bg-violet-500 text-white' : step === i + 1 ? 'bg-violet-500/20 text-violet-600 ring-2 ring-violet-500/40' : 'bg-surface-elevated'}`}>{i + 1}</span>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0 space-y-4">
          {!isBulk && step === 1 && lead && (
            <div className="p-3 rounded-xl bg-surface-elevated/50 border border-subtle text-sm mb-2">
              <p className="font-semibold text-content-primary">{lead.name}</p>
              <p className="text-content-muted">{lead.destination} · {lead.sourceLabel}</p>
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5">1. Select Team</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30">
                  <option value="">Choose team…</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} · {t.members?.length || 0} members</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button type="button" disabled={!teamId} onClick={() => setStep(2)}>Next</Button>
              </div>
            </>
          )}

          {step === 2 && selectedTeam && (
            <>
              <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-2 flex items-center gap-1"><Crown className="w-3 h-3 text-amber-500" /> 2. Team Leader</p>
                <div className="flex items-center gap-3">
                  <Avatar name={selectedTeam.teamLeader?.name} size="sm" />
                  <div>
                    <p className="font-semibold text-content-primary">{selectedTeam.teamLeader?.name}</p>
                    <p className="text-xs text-content-muted">{selectedTeam.teamLeader?.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
                <Button type="button" variant="outline" onClick={assignToTeamLeader}>
                  Assign to Team Leader only
                </Button>
                <Button type="button" onClick={() => setStep(3)}>Assign to Executive →</Button>
              </div>
            </>
          )}

          {step === 3 && selectedTeam && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-content-muted mb-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 3. Assign to Executive</label>
                <select name="executiveId" required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-violet-500/30">
                  <option value="">Select executive in {selectedTeam.name}…</option>
                  {selectedTeam.members?.map((ex) => (
                    <option key={ex._id} value={ex._id}>{ex.name}</option>
                  ))}
                </select>
                {!selectedTeam.members?.length && (
                  <p className="text-xs text-amber-600 mt-2">This team has no executives. Add members first.</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-surface-elevated/50 text-[11px] text-content-muted">
                Flow: Sales Manager → <span className="font-semibold text-violet-600">{selectedTeam.name}</span> → <span className="font-semibold">{selectedTeam.teamLeader?.name}</span> → Executive
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" disabled={!selectedTeam.members?.length}>Confirm Assignment</Button>
              </div>
            </>
          )}
        </div>
      </form>
    </AppModal>
  );
}
