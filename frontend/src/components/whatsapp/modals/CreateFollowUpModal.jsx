import { useState, useEffect } from 'react';
import AppModal from '../../ui/AppModal';
import { Button } from '../../ui/button';
import { FOLLOWUP_CATEGORIES } from '../../followups/constants';

export default function CreateFollowUpModal({ open, onClose, onSubmit, leadName }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [category, setCategory] = useState('warm');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
      setNotes('');
      setCategory('warm');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) {
      setError('Please select date');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await onSubmit({ scheduledAt, notes, type: 'whatsapp', category });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-content-primary">Add Follow-up</h3>
          <p className="text-sm text-content-secondary mt-1">{leadName}</p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

        <div>
          <label className="text-xs font-medium text-content-secondary mb-1 block">Follow-up Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-strong bg-surface px-3 py-2.5 text-sm font-medium"
          >
            {FOLLOWUP_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-content-secondary mb-1 block">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-strong bg-surface px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-content-secondary mb-1 block">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-strong bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-content-secondary mb-1 block">Remarks *</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Follow-up agenda..."
            rows={3}
            required
            className="w-full rounded-xl border border-strong bg-surface px-4 py-3 text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="emerald" disabled={saving || !date}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
};
