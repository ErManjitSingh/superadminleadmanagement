import { useState } from 'react';
import AppModal from '../ui/AppModal';
import { Button } from '../ui/button';
import { addCallNote } from '../../services/leadEnterpriseApi';

const OUTCOMES = [
  { value: 'interested', label: 'Interested' },
  { value: 'need_better_hotel', label: 'Need Better Hotel' },
  { value: 'budget_issue', label: 'Budget Issue' },
  { value: 'call_back_tomorrow', label: 'Call Back Tomorrow' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'other', label: 'Other' },
];

export default function CallNoteModal({ open, onClose, leadId, onSaved }) {
  const [outcome, setOutcome] = useState('interested');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setSubmitting(true);
    try {
      await addCallNote(leadId, {
        outcome,
        notes: notes.trim(),
        duration: duration ? Number(duration) : 0,
      });
      setNotes('');
      setDuration('');
      onSaved?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-content-primary">Log Call Note</h3>
          <p className="text-sm text-content-secondary mt-1">Record the call outcome and notes for this lead</p>
        </div>

        <div>
          <label className="text-xs font-medium text-content-muted uppercase tracking-wide">Outcome</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
          >
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-content-muted uppercase tracking-wide">Notes *</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            required
            placeholder="What was discussed? Next steps?"
            className="mt-1.5 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-content-muted uppercase tracking-wide">Duration (minutes)</label>
          <input
            type="number"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Optional"
            className="mt-1.5 w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="emerald" disabled={submitting || !notes.trim()}>
            {submitting ? 'Saving...' : 'Save Call Note'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
}
