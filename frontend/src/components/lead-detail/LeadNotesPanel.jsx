import { Send } from 'lucide-react';
import { DETAIL_CARD } from './leadDetailUtils';

export default function LeadNotesPanel({ notes = [], legacyNote = '', loading = false }) {
  const items = notes.length ? notes : legacyNote ? [{ message: legacyNote, user: 'Team', date: null }] : [];

  return (
    <div className={DETAIL_CARD}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Notes</h3>
      </div>
      <div className="p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-2">Loading notes…</p>
        ) : items.length ? items.slice(0, 3).map((n) => (
          <div key={n.id || n.message} className="rounded-xl border border-amber-100 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-900/30 p-3">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{n.message}</p>
            {n.user && (
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1.5 font-medium">{n.user}</p>
            )}
          </div>
        )) : (
          <p className="text-sm text-slate-400 text-center py-2">No notes yet</p>
        )}
        <div className="relative">
          <input
            type="text"
            readOnly
            placeholder="Add a quick note..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 pr-10 text-sm text-slate-500"
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-violet-500 hover:bg-violet-50" aria-label="Send note">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
