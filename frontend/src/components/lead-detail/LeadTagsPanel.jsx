import { Plus } from 'lucide-react';
import { deriveLeadTags, DETAIL_CARD } from './leadDetailUtils';

export default function LeadTagsPanel({ lead }) {
  const tags = deriveLeadTags(lead);

  return (
    <div className={DETAIL_CARD}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tags</h3>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/40"
          >
            {tag}
          </span>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-slate-500 border border-dashed border-slate-300 hover:border-violet-300 hover:text-violet-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Tag
        </button>
      </div>
    </div>
  );
}
