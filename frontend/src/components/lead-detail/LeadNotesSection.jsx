import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Pencil, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/button';

function formatNoteTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function LeadNotesSection({ notes: initialNotes }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes([
      { id: `n-${Date.now()}`, user: 'You', message: draft.trim(), date: new Date().toISOString(), isOwn: true },
      ...notes,
    ]);
    setDraft('');
  };

  const saveEdit = (id) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, message: editText } : n)));
    setEditingId(null);
  };

  const deleteNote = (id) => {
    if (window.confirm('Delete this note?')) setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-subtle bg-surface-elevated/40">
        <h3 className="text-[15px] font-semibold text-content-primary">Notes</h3>
        <p className="text-xs text-content-muted mt-0.5">Internal team conversation</p>
      </div>

      <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin bg-surface-elevated/20">
        <AnimatePresence initial={false}>
          {[...notes].reverse().map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${note.isOwn ? 'flex-row-reverse' : ''}`}
            >
              {!note.isOwn && <Avatar name={note.user} size="sm" className="!w-8 !h-8 !text-xs shrink-0 mt-1" />}
              <div className={`max-w-[85%] group ${note.isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    note.isOwn
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-surface border border-subtle text-content-primary rounded-bl-md'
                  }`}
                >
                  {editingId === note.id ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-transparent outline-none resize-none text-sm min-h-[60px]"
                    />
                  ) : (
                    note.message
                  )}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${note.isOwn ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-content-muted">{note.user} · {formatNoteTime(note.date)}</span>
                  {note.isOwn && editingId !== note.id && (
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button onClick={() => { setEditingId(note.id); setEditText(note.message); }} className="p-0.5 text-content-muted hover:text-brand-600">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteNote(note.id)} className="p-0.5 text-content-muted hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {editingId === note.id && (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(note.id)} className="text-[10px] text-brand-600 font-medium">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-[10px] text-content-muted">Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-subtle flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
          placeholder="Type a note..."
          className="input-premium flex-1 h-10 rounded-xl text-sm"
        />
        <Button
          onClick={addNote}
          size="icon"
          className="rounded-xl h-10 w-10 shrink-0 bg-amber-600 hover:bg-amber-500 shadow-sm shadow-amber-600/20"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
