import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import AppModal from '../ui/AppModal';
import { DEPARTMENTS } from './constants';

const empty = {
  name: '',
  email: '',
  phone: '',
  roleId: '',
  department: 'Sales',
  status: 'active',
  password: '',
  confirmPassword: '',
};

export default function UserFormModal({ open, onClose, onSave, user, roles }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        roleId: user.roleId,
        department: user.department,
        status: user.status,
        password: '',
        confirmPassword: '',
      });
    } else {
      setForm({
        ...empty,
        roleId: roles[0]?._id || '',
      });
    }
  }, [user, roles, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      if (!form.password || form.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    } else if (form.password && form.password.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      roleId: form.roleId,
      department: form.department,
      status: form.status,
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <AppModal open={open} onClose={onClose} size="lg" className="overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
        <h2 className="text-lg font-bold text-content-primary">{user ? 'Edit User' : 'Add New User'}</h2>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated text-content-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} required disabled={!!user} />
          <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          <div>
            <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm text-content-primary focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Role</label>
            <select
              value={form.roleId}
              onChange={(e) => set('roleId', e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm text-content-primary focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
            >
              {roles.length === 0 && <option value="">No roles — run database seed</option>}
              {roles.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm text-content-primary focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="invited">Invited</option>
            </select>
          </div>
          {!user && (
            <>
              <Field label="Password" type="password" value={form.password} onChange={(v) => set('password', v)} required hint="Min 6 characters" />
              <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={(v) => set('confirmPassword', v)} required />
            </>
          )}
          {user && (
            <Field label="New Password (optional)" type="password" value={form.password} onChange={(v) => set('password', v)} hint="Leave blank to keep current password" />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.roleId}>
            {saving ? 'Saving…' : user ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
}

function Field({ label, value, onChange, type = 'text', required, disabled, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm text-content-primary focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none disabled:opacity-60"
      />
      {hint && <p className="text-[11px] text-content-muted mt-1">{hint}</p>}
    </div>
  );
}
