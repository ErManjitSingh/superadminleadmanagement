import { useState } from 'react';
import AppModal from '../../ui/AppModal';
import { Button } from '../../ui/button';

export default function AddNoteModal({ open, onClose, onSubmit, leadName }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
    onClose();
  };

  return (
    <AppModal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-content-primary">Add Note</h3>
          <p className="text-sm text-content-secondary mt-1">Add an internal note for {leadName}</p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your note..."
          rows={4}
          className="w-full rounded-xl border border-strong bg-surface px-4 py-3 text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="emerald" disabled={!text.trim()}>Save Note</Button>
        </div>
      </form>
    </AppModal>
  );
}
