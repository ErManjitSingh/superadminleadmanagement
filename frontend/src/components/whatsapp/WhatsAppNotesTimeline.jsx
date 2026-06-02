import { motion } from 'framer-motion';
import { StickyNote } from 'lucide-react';
import { formatFullDateTime, getInitials } from './whatsappUtils';

export default function WhatsAppNotesTimeline({ notes, onAddNote }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-wa-text-muted flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5" />
          Notes
        </h4>
        <button
          type="button"
          onClick={onAddNote}
          className="text-[11px] font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          + Add note
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-wa-text-muted italic py-2">No notes yet</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {notes.map((note, i) => (
            <motion.div
              key={note._id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-violet-500/15 text-violet-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {getInitials(note.user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="rounded-xl rounded-tl-sm px-3 py-2 bg-wa-bubble-in border border-wa-border/50">
                  <p className="text-xs text-wa-text-primary leading-relaxed">{note.text}</p>
                </div>
                <p className="text-[10px] text-wa-text-muted mt-1 px-1">
                  {note.user?.name} · {formatFullDateTime(note.createdAt)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
