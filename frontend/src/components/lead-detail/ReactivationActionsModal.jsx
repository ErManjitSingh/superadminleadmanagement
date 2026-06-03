import { useEffect, useState } from 'react';
import { RefreshCw, UserPlus, TrendingUp } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';

const MODE_META = {
  reactivate: {
    title: 'Reactivate Lost Lead',
    desc: 'Lead wapas pipeline me aayegi. Executive follow-up dalega to status Active ho jayega.',
    icon: RefreshCw,
    submit: 'Reactivate',
  },
  reassign: {
    title: 'Reassign Reactivated Lead',
    desc: 'Recovery ke baad lead ko squad executive ko assign karo.',
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
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState('');
  const [executiveId, setExecutiveId] = useState('');
  const [stage, setStage] = useState('contacted');
  const [note, setNote] = useState('');

  const meta = MODE_META[mode] || MODE_META.reactivate;
  const Icon = meta.icon;

  useEffect(() => {
    if (!open) return;
    setReason('');
    setExecutiveId('');
    setStage('contacted');
    setNote('');
  }, [open, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'reactivate') onSubmit?.({ reason });
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
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
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
                className="input-premium min-h-[120px] w-full"
              />
            </label>
          )}

          {mode === 'reassign' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase text-content-muted mb-1.5 block">
                Assign to executive <span className="text-rose-500">*</span>
              </span>
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
            </label>
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
            <Button type="submit" variant="teal" className="gap-1.5">
              <Icon className="w-4 h-4" />
              {meta.submit}
            </Button>
          </div>
        </div>
      </form>
    </AppModal>
  );
}
