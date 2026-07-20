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
    <div className={cn(DETAIL_CARD, 'h-full flex flex-col min-h-[320px]')}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 inline-flex items-center justify-center">
          <StickyNote className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Notes</h3>
      </div>
      <div className="p-4 space-y-3 flex-1">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-6">Loading notes…</p>
        ) : items.length ? (
          items.slice(0, 3).map((n) => (
            <div
              key={n.id || n.message}
              className="rounded-xl border border-slate-100 bg-[#fafafa] dark:bg-slate-800/40 dark:border-slate-700 p-3.5"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{n.message}</p>
              <div className="flex items-center justify-between gap-2 mt-3">
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
          <p className="text-sm text-slate-400 text-center py-10">No notes yet</p>
        )}
      </div>
      <div className="p-4 pt-0 mt-auto">
        <button
          type="button"
          onClick={onAddNote}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-sm font-semibold py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>
    </div>
  );
}
