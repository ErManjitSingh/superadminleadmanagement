import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import AppModal from '../ui/AppModal';
import { FOLLOWUP_PRIORITIES, FOLLOWUP_CATEGORIES, FOLLOWUP_TYPES } from './constants';

const emptyForm = {
  lead: '',
  type: 'call',
  category: 'warm',
  date: '',
  time: '10:00',
  priority: 'medium',
  remarks: '',
};

export default function AddFollowUpModal({
  open,
  onClose,
  onSubmit,
  leads = [],
  editData = null,
  fixedLeadId = null,
  fixedLeadName = null,
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editData) {
      const d = new Date(editData.scheduledAt);
      setForm({
        lead: editData.lead?._id || fixedLeadId || '',
        type: editData.type || 'call',
        category: editData.category || 'warm',
        date: d.toISOString().split('T')[0],
        time: d.toTimeString().slice(0, 5),
        priority: editData.priority || 'medium',
        remarks: editData.notes || '',
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setForm({ ...emptyForm, lead: fixedLeadId || '', date: today });
    }
  }, [editData, open, fixedLeadId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.date) {
      setError('Please select follow-up date');
      return;
    }
    if (!fixedLeadId && !editData && !form.lead) {
      setError('Please select a lead');
      return;
    }
    if (!form.remarks?.trim()) {
      setError('Please enter remarks');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...form,
        lead: fixedLeadId || form.lead,
        scheduledAt: `${form.date}T${form.time}:00`,
        notes: form.remarks.trim(),
      });
      if (!editData) {
        const today = new Date().toISOString().split('T')[0];
        setForm({ ...emptyForm, lead: fixedLeadId || '', date: today });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save follow-up');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="lg" className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-content-primary">{editData ? 'Update Follow-up' : 'Add Follow-up'}</h3>
          <p className="text-xs text-content-muted">
            {fixedLeadName || 'Select category, date & save'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
        )}

        {!editData && !fixedLeadId && (
          <div>
            <label className="text-xs font-medium text-content-muted mb-1 block">Lead *</label>
            <select
              value={form.lead}
              onChange={(e) => setForm({ ...form, lead: e.target.value })}
              required
              className="input-premium w-full h-11 rounded-xl"
            >
              <option value="">Select lead</option>
              {leads.map((l) => (
                <option key={l._id} value={l._id}>{l.name} — {l.destination}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-content-muted mb-1 block">Follow-up Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
            className="input-premium w-full h-11 rounded-xl font-medium"
          >
            {FOLLOWUP_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className="text-[10px] text-content-muted mt-1">Warm → Cold → Converted → Expected Conv.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-content-muted mb-1 block">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-premium w-full h-11 rounded-xl">
              {FOLLOWUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-content-muted mb-1 block">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-premium w-full h-11 rounded-xl">
              {FOLLOWUP_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-content-muted mb-1 block">Date *</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="input-premium w-full h-11 rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-content-muted mb-1 block">Time *</label>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required className="input-premium w-full h-11 rounded-xl" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-content-muted mb-1 block">Remarks *</label>
          <textarea
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            required
            rows={3}
            className="input-premium w-full rounded-xl resize-none"
            placeholder="What to discuss on this follow-up..."
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="violet" className="flex-1 rounded-xl" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
};
