/** Shared compact table spacing (~30% tighter than px-4 py-4) */
export const compactTable = 'w-full text-sm table-auto border-collapse';
export const compactTh = 'text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-content-muted whitespace-nowrap';
export const compactTd = 'px-2 py-2 align-middle text-sm';
export const compactTdWrap = 'px-2 py-2 align-middle text-sm max-w-[140px] truncate';
export const compactPagination = 'px-3 py-2';

/** Single sticky actions column (Assign + More grouped on the right) */
export const stickyRowActionsTh = `${compactTh} sticky right-0 z-30 px-1 py-1 text-right bg-surface-elevated shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.12)]`;

export function stickyRowActionsTd(rowIndex) {
  const bg = rowIndex % 2 === 1 ? 'bg-white dark:bg-slate-800' : 'bg-surface';
  return `px-1 py-1 align-middle text-sm text-right sticky right-0 z-[1] group-hover:z-20 min-w-[96px] ${bg} group-hover:bg-brand-500/[0.06] shadow-[-4px_0_8px_-4px_rgba(15,23,42,0.1)]`;
}
