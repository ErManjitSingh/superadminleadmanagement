import { useEffect, useState } from 'react';
import { GitMerge } from 'lucide-react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { mergeLeads, checkLeadDuplicate } from '../../services/leadEnterpriseApi';

export default function MergeLeadModal({
  open,
  onClose,
  targetLead,
  onMerged,
  initialSourceId = null,
}) {
  const [sourceId, setSourceId] = useState(initialSourceId || '');
  const [matches, setMatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !targetLead) return;
    setSourceId(initialSourceId || '');
    checkLeadDuplicate({
      phone: targetLead.phone,
      email: targetLead.email,
      alternatePhone: targetLead.alternatePhone,
      excludeId: targetLead._id,
    })
      .then((res) => setMatches(res.matches || []))
      .catch(() => setMatches([]));
  }, [open, targetLead, initialSourceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetLead?._id) return;
    setSubmitting(true);
    try {
      await mergeLeads(sourceId, targetLead._id);
      onMerged?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!targetLead) return null;

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content-primary">Merge Duplicate Lead</h3>
            <p className="text-sm text-content-secondary mt-1">
              Merge a duplicate into <span className="font-medium">{targetLead.name}</span>. The source lead will be archived.
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-content-muted uppercase tracking-wide">Source lead (duplicate)</label>
          {matches.length ? (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {matches.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setSourceId(m._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    sourceId === m._id
                      ? 'border-violet-500 bg-violet-500/5 ring-1 ring-violet-500/30'
                      : 'border-subtle hover:bg-surface-elevated/50'
                  }`}
                >
                  <p className="text-sm font-medium text-content-primary">{m.name}</p>
                  <p className="text-xs text-content-muted mt-0.5">
                    {m.phone} · {m.status} · {m.daysAgo}d ago
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-content-muted">No duplicate matches found for this lead.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!sourceId || submitting}>
            {submitting ? 'Merging...' : 'Merge Leads'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
}
