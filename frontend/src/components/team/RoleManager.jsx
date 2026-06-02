import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, Users, Pencil, Trash2, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import PermissionMatrix from './PermissionMatrix';
import RoleCreatorModal from './RoleCreatorModal';

export default function RoleManager({ roles, onCreateRole, onUpdateRole, onDeleteRole, canCreate = true, canEdit = true, canDelete = true }) {
  const [selected, setSelected] = useState(roles[0]?._id || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);

  const active = roles.find((r) => r._id === selected);

  const handlePermChange = (mod, action, checked) => {
    if (!active || active.isSystem) return;
    const permissions = { ...active.permissions, [mod]: { ...active.permissions[mod], [action]: checked } };
    onUpdateRole(active._id, { permissions });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider">Roles</h3>
          <Button size="sm" onClick={() => { setEditRole(null); setModalOpen(true); }} disabled={!canCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> Custom Role
          </Button>
        </div>
        <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden divide-y divide-subtle">
          {roles.map((role, i) => (
            <motion.button
              key={role._id}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(role._id)}
              className={`w-full text-left px-4 py-4 flex items-start gap-3 transition-colors ${selected === role._id ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-surface-elevated/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${selected === role._id ? 'bg-brand-500/20' : 'bg-violet-500/10'}`}>
                {role.isSystem ? <Lock className="w-4 h-4 text-violet-600" /> : <Shield className="w-4 h-4 text-brand-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-content-primary">{role.name}</span>
                  {role.isSystem && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-content-muted font-medium">System</span>}
                </div>
                <p className="text-xs text-content-muted mt-0.5 line-clamp-2">{role.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-content-secondary">
                  <Users className="w-3 h-3" /> {role.userCount ?? 0} users
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-8">
        {active ? (
          <motion.div key={active._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-content-primary">{active.name}</h3>
                <p className="text-sm text-content-secondary mt-1">{active.description}</p>
              </div>
              {!active.isSystem && canEdit && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setEditRole(active); setModalOpen(true); }}>
                    <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                  </Button>
                  {canDelete && (
                    <Button size="sm" variant="ghost" className="text-rose-600 hover:text-rose-600 hover:bg-rose-500/10" onClick={() => onDeleteRole(active._id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
            <PermissionMatrix
              permissions={active.permissions}
              onChange={handlePermChange}
              readOnly={active.isSystem}
            />
            {active.isSystem && (
              <p className="text-xs text-content-muted italic">System roles have predefined permissions and cannot be modified.</p>
            )}
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-subtle bg-surface/80 p-12 text-center text-content-muted">Select a role to view permissions</div>
        )}
      </div>

      <RoleCreatorModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRole(null); }}
        onSave={(data) => (editRole ? onUpdateRole(editRole._id, data) : onCreateRole(data))}
        role={editRole}
      />
    </div>
  );
}
