import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import AppModal from '../ui/AppModal';
import PermissionMatrix from './PermissionMatrix';
import { PERMISSION_MODULES } from './constants';

function emptyPerms() {
  return Object.fromEntries(
    Object.entries(PERMISSION_MODULES).map(([mod, cfg]) => [
      mod,
      Object.fromEntries(cfg.actions.map((a) => [a, false])),
    ])
  );
}

export default function RoleCreatorModal({ open, onClose, onSave, role }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState(emptyPerms());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      setPermissions(role.permissions || emptyPerms());
    } else {
      setName('');
      setDescription('');
      setPermissions(emptyPerms());
    }
  }, [role, open]);

  const handlePermChange = (mod, action, checked) => {
    setPermissions((p) => ({ ...p, [mod]: { ...p[mod], [action]: checked } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, description, permissions });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal open={open} onClose={onClose} size="3xl" className="overflow-hidden flex flex-col max-h-[min(calc(100vh-2rem),920px)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0">
        <h2 className="text-lg font-bold text-content-primary">{role ? 'Edit Role' : 'Create Custom Role'}</h2>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated text-content-muted"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Role Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="e.g. Regional Manager" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Description</label>
                      <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm focus:ring-2 focus:ring-brand-500/30 outline-none" placeholder="Brief role description" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-2">Permissions</label>
                    <PermissionMatrix permissions={permissions} onChange={handlePermChange} />
                  </div>
                </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-subtle shrink-0">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : role ? 'Update Role' : 'Create Role'}</Button>
        </div>
      </form>
    </AppModal>
  );
}
