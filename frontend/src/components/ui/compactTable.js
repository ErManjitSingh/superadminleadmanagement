/** Shared compact table spacing (~30% tighter than px-4 py-4) */
export const compactTable = 'w-full text-sm table-auto border-collapse';
export const compactTh = 'text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-content-muted whitespace-nowrap';
export const compactTd = 'px-2 py-2 align-middle text-sm';
export const compactTdWrap = 'px-2 py-2 align-middle text-sm max-w-[140px] truncate';
export const compactPagination = 'px-3 py-2';

/** Single sticky actions column (Assign + More grouped on the right) */
export const stickyRowActionsTh = `${compactTh} sticky right-0 z-30 px-1 py-1 text-right bg-surface-elevated border-l border-subtle shadow-[-4px_0_8px_-4px_rgba(15,23,42,0.08)]`;

export function stickyRowActionsTd(rowIndex) {
  const even = rowIndex % 2 === 0;
  const bg = even ? 'bg-surface' : 'bg-white dark:bg-slate-800';
  const hover = even
    ? 'group-hover:bg-slate-50 dark:group-hover:bg-slate-800'
    : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-700';
  return `px-1 py-1 align-middle text-sm text-right sticky right-0 z-[2] min-w-[96px] border-l border-subtle ${bg} ${hover}`;
}
