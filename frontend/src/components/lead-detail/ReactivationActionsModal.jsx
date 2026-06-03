import { useEffect, useState } from 'react';
import { RefreshCw, UserPlus, TrendingUp, User } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const MODE_META = {
  reactivate: {
    title: 'Reactivate Lost Lead',
    desc: 'Executive select karo jisko ye lead assign karni hai — unke Reactivated Leads me turant dikhegi.',
    icon: RefreshCw,
    submit: 'Reactivate & Assign',
  },
  reassign: {
    title: 'Reassign Reactivated Lead',
    desc: 'Recovery ke baad lead ko dusre executive ko assign karo.',
    icon: UserPlus,
    submit: 'Assign Executive',
  },
  stage: {
    title: 'Update Recovery Stage',
    desc: 'Reactivation progress manually update karo.',
    icon: TrendingUp,
    submit: 'Save Progress',
  },
};

export default function ReactivationActionsModal({
  open,
  mode = 'reactivate',
  executives = [],
  executivesLoading = false,
  lead = null,
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [executiveId, setExecutiveId] = useState('');
  const [stage, setStage] = useState('contacted');
  const [note, setNote] = useState('');

  const meta = MODE_META[mode] || MODE_META.reactivate;
  const Icon = meta.icon;
  const showExecutivePicker = mode === 'reactivate' || mode === 'reassign';

  useEffect(() => {
    if (!open) return;
    setReason('');
    setStage('contacted');
    setNote('');
    const prevExec = lead?.assignedTo?._id || lead?.assignedTo || '';
    setExecutiveId(prevExec ? String(prevExec) : '');
  }, [open, mode, lead]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showExecutivePicker && !executiveId) return;
    if (mode === 'reactivate') onSubmit?.({ reason, executiveId });
    if (mode === 'reassign') onSubmit?.({ executiveId });
    if (mode === 'stage') onSubmit?.({ stage, note });
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-emerald-500/10 px-6 py-5 border-b border-teal-500/20">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-surface/90 text-teal-600 shadow-sm">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-content-primary">{meta.title}</h3>
              <p className="text-sm text-content-muted mt-0.5">{meta.desc}</p>
              {lead?.name && (
                <p className="text-xs font-semibold text-teal-700 mt-1">{lead.name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {showExecutivePicker && (
            <div>
              <span className="text-xs font-semibold uppercase text-content-muted mb-2 block">
                Assign to executive <span className="text-rose-500">*</span>
              </span>
              {executivesLoading ? (
                <div className="h-24 rounded-xl border border-subtle bg-surface-elevated/50 flex items-center justify-center text-sm text-content-muted">
                  Loading executives…
                </div>
              ) : executives.length === 0 ? (
                <div className="h-24 rounded-xl border border-amber-500/25 bg-amber-500/5 flex items-center justify-center text-sm text-amber-800 px-4 text-center">
                  Koi active executive nahi mila. Pehle team me executive add karein.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {executives.map((ex) => {
                    const id = String(ex._id);
                    const selected = executiveId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setExecutiveId(id)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all',
                          selected
                            ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30'
                            : 'border-subtle bg-surface hover:border-teal-500/40 hover:bg-teal-500/5'
                        )}
                      >
                        <span className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          selected ? 'bg-teal-600 text-white' : 'bg-surface-elevated text-content-muted'
                        )}>
                          <User className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-content-primary truncate">{ex.name}</span>
                          {ex.email && (
                            <span className="block text-[10px] text-content-muted truncate">{ex.email}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {mode === 'reactivate' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase text-content-muted mb-1.5 block">
                Reactivation reason <span className="text-rose-500">*</span>
              </span>
              <textarea
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Example: Customer ne dubara inquiry ki, budget confirm hua…"
                className="input-premium min-h-[100px] w-full"
              />
            </label>
          )}

          {mode === 'reassign' && executives.length > 0 && (
            <select
              required
              value={executiveId}
              onChange={(e) => setExecutiveId(e.target.value)}
              className="input-premium h-10 w-full"
            >
              <option value="">Select executive</option>
              {executives.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name}</option>
              ))}
            </select>
          )}

          {mode === 'stage' && (
            <>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-content-muted mb-1.5 block">Stage</span>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="input-premium h-10 w-full"
                >
                  <option value="contacted">Contacted</option>
                  <option value="follow_up_scheduled">Follow Up Scheduled</option>
                  <option value="quotation_sent">Quotation Sent</option>
                  <option value="converted">Converted</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-content-muted mb-1.5 block">Note</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for timeline"
                  className="input-premium min-h-[90px] w-full"
                />
              </label>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="teal"
              className="gap-1.5"
              disabled={showExecutivePicker && (!executiveId || executives.length === 0)}
            >
              <Icon className="w-4 h-4" />
              {meta.submit}
            </Button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}
