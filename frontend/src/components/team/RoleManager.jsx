import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Shield, Users, Pencil, Trash2, Lock, Save, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import PermissionMatrix from './PermissionMatrix';
import RoleCreatorModal from './RoleCreatorModal';
import { toast } from '../../context/ToastContext';

function clonePerms(perms) {
  return JSON.parse(JSON.stringify(perms || {}));
}

export default function RoleManager({
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  canCreate = true,
  canEdit = true,
  canDelete = true,
}) {
  const [selected, setSelected] = useState(roles[0]?._id || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [draftPerms, setDraftPerms] = useState(null);
  const [saving, setSaving] = useState(false);

  const active = roles.find((r) => r._id === selected);

  useEffect(() => {
    if (roles.length && !roles.find((r) => r._id === selected)) {
      setSelected(roles[0]?._id || null);
    }
  }, [roles, selected]);

  useEffect(() => {
    if (active?.permissions) {
      setDraftPerms(clonePerms(active.permissions));
    } else {
      setDraftPerms(null);
    }
  }, [active?._id, active?.permissions]);

  const isDirty = useMemo(() => {
    if (!active || !draftPerms || active.isSystem) return false;
    return JSON.stringify(draftPerms) !== JSON.stringify(active.permissions);
  }, [active, draftPerms]);

  const handlePermChange = (mod, action, checked) => {
    if (!active || active.isSystem || !canEdit) return;
    setDraftPerms((p) => ({ ...p, [mod]: { ...p[mod], [action]: checked } }));
  };

  const handleDiscard = () => {
    if (active?.permissions) setDraftPerms(clonePerms(active.permissions));
  };

  const handleSavePermissions = async () => {
    if (!active || !isDirty || active.isSystem) return;
    setSaving(true);
    try {
      await onUpdateRole(active._id, { permissions: draftPerms });
      toast.success(`${active.name} permissions saved`);
    } catch {
      /* toast via axios */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-content-muted px-1">
        <span className="font-semibold text-brand-600 dark:text-brand-400">Admin</span>
        <ChevronRight className="w-3 h-3" />
        <span className="font-semibold text-content-primary">Role Management</span>
        {active && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-content-secondary">{active.name}</span>
          </>
        )}
      </div>

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
                className={`w-full text-left px-4 py-4 flex items-start gap-3 transition-colors ${
                  selected === role._id ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-surface-elevated/50'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${selected === role._id ? 'bg-brand-500/20' : 'bg-violet-500/10'}`}>
                  {role.isSystem ? <Lock className="w-4 h-4 text-violet-600" /> : <Shield className="w-4 h-4 text-brand-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-content-primary">{role.name}</span>
                    {role.isSystem && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-content-muted font-medium">
                        System
                      </span>
                    )}
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
                  <h3 className="text-lg font-bold text-content-primary">Permissions</h3>
                  <p className="text-sm text-content-secondary mt-1">
                    {active.name}
                    {active.description ? ` · ${active.description}` : ''}
                  </p>
                </div>
                {!active.isSystem && canEdit && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setEditRole(active); setModalOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit role
                    </Button>
                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => onDeleteRole(active._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <PermissionMatrix
                permissions={active.isSystem ? active.permissions : draftPerms}
                onChange={handlePermChange}
                readOnly={active.isSystem || !canEdit}
              />

              {active.isSystem ? (
                <p className="text-xs text-content-muted italic rounded-xl border border-subtle bg-surface-elevated/40 px-4 py-3">
                  System roles have predefined permissions and cannot be modified.
                </p>
              ) : (
                <AnimatePresence>
                  {canEdit && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl ${
                        isDirty
                          ? 'border-brand-500/30 bg-surface/95 shadow-brand-500/10'
                          : 'border-subtle bg-surface/80'
                      }`}
                    >
                      <p className="text-sm text-content-secondary">
                        {isDirty ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved permission changes</span>
                        ) : (
                          'Toggle permissions, then save'
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isDirty || saving}
                          onClick={handleDiscard}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!isDirty || saving}
                          onClick={handleSavePermissions}
                          className="min-w-[120px]"
                        >
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          {saving ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-subtle bg-surface/80 p-12 text-center text-content-muted">
              Select a role to manage permissions
            </div>
          )}
        </div>

        <RoleCreatorModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditRole(null); }}
          onSave={(data) => (editRole ? onUpdateRole(editRole._id, data) : onCreateRole(data))}
          role={editRole}
        />
      </div>
    </div>
  );
}
