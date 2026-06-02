import { useEffect, useState } from 'react';
import { X, Mail, Copy, CheckCircle2, Send } from 'lucide-react';
import { Button } from '../ui/button';
import AppModal from '../ui/AppModal';
import { DEPARTMENTS } from './constants';

const empty = { name: '', email: '', phone: '', roleId: '', department: 'Sales' };

export default function InviteUserModal({ open, onClose, onInvite, roles }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...empty, roleId: roles[0]?._id || '' });
      setResult(null);
      setCopied(false);
    }
  }, [open, roles]);

  const inviteLink = result?.inviteToken
    ? `${window.location.origin}/accept-invite/${result.inviteToken}`
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await onInvite(form);
      setResult(res);
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <AppModal open={open} onClose={onClose} size="lg" className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/10"><Send className="w-4 h-4 text-brand-600" /></div>
          <h2 className="text-lg font-bold text-content-primary">Invite User</h2>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated text-content-muted"><X className="w-4 h-4" /></button>
      </div>

      {result ? (
        <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-content-primary">Invitation sent!</p>
                      <p className="text-sm text-content-secondary mt-1">
                        An invite email was sent to <span className="font-medium text-brand-600">{form.email}</span>. They can set their password using the link below.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Invite Link</label>
                    <div className="flex gap-2">
                      <input readOnly value={inviteLink} className="flex-1 px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-xs text-content-secondary truncate" />
                      <Button type="button" variant="outline" onClick={copyLink}>
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-content-muted mt-2">Link expires in 7 days</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={onClose}>Done</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <p className="text-sm text-content-secondary">Send an email invitation. The user will set their password when they accept.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Optional" />
                    <Field label="Email" type="email" icon={Mail} value={form.email} onChange={(v) => set('email', v)} required placeholder="user@company.com" />
                    <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} placeholder="Optional" />
                    <div>
                      <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Department</label>
                      <select value={form.department} onChange={(e) => set('department', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-brand-500/30">
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Role</label>
                      <select value={form.roleId} onChange={(e) => set('roleId', e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-brand-500/30">
                        {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                      <Send className="w-4 h-4 mr-1.5" /> {saving ? 'Sending…' : 'Send Invitation'}
                    </Button>
                  </div>
                </form>
              )}
    </AppModal>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder, icon: Icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'px-3'} pr-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-brand-500/30`}
        />
      </div>
    </div>
  );
}
