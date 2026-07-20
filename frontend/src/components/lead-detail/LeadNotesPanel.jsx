import { StickyNote, Plus } from 'lucide-react';
import { DETAIL_CARD } from './leadDetailUtils';
import { cn } from '../../lib/utils';

export default function LeadNotesPanel({ notes = [], legacyNote = '', loading = false, onAddNote }) {
  const items = notes.length
    ? notes
    : legacyNote
      ? [{ message: legacyNote, user: 'Team', date: null }]
      : [];

  return (
    <div className={cn(DETAIL_CARD, 'h-full flex flex-col')}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <StickyNote className="w-4 h-4 text-violet-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Notes</h3>
      </div>
      <div className="p-4 space-y-3 flex-1">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Loading notes…</p>
        ) : items.length ? (
          items.slice(0, 4).map((n) => (
            <div
              key={n.id || n.message}
              className="rounded-xl border border-slate-100 bg-slate-50/80 dark:bg-slate-800/40 dark:border-slate-700 p-3.5"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{n.message}</p>
              <div className="flex items-center justify-between gap-2 mt-2.5">
                {n.user && <p className="text-[11px] text-slate-500 font-medium">{n.user}</p>}
                {n.date && (
                  <p className="text-[11px] text-slate-400">
                    {new Date(n.date).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No notes yet</p>
        )}
      </div>
      <div className="p-4 pt-0">
        <button
          type="button"
          onClick={onAddNote}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 hover:bg-violet-50 text-violet-700 text-sm font-semibold py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>
    </div>
  );
}
