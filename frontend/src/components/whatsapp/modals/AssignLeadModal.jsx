import { useState } from 'react';
import AppModal from '../../ui/AppModal';
import { Button } from '../../ui/button';

export default function AssignLeadModal({ open, onClose, onSubmit, executives, currentAssignee }) {
  const [executiveId, setExecutiveId] = useState(currentAssignee?._id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const exec = executives.find((e) => e._id === executiveId);
    if (!exec) return;
    onSubmit({ _id: exec._id, name: exec.name });
    onClose();
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-content-primary">Assign Lead</h3>
          <p className="text-sm text-content-secondary mt-1">Assign this lead to a sales executive</p>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {executives.map((ex) => (
            <button
              key={ex._id}
              type="button"
              onClick={() => setExecutiveId(ex._id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                executiveId === ex._id
                  ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                  : 'border-strong hover:bg-surface-secondary'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {ex.name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-content-primary">{ex.name}</p>
                <p className="text-xs text-content-secondary">{ex.email}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="emerald" disabled={!executiveId}>Assign</Button>
        </div>
      </form>
    </AppModal>
  );
}
