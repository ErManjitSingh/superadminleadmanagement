/** Shared compact table spacing (~30% tighter than px-4 py-4) */
export const compactTable = 'w-full text-sm table-auto border-collapse';
export const compactTh = 'text-left px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-content-muted whitespace-nowrap';
export const compactTd = 'px-2 py-2 align-middle text-sm';
export const compactTdWrap = 'px-2 py-2 align-middle text-sm max-w-[140px] truncate';
export const compactPagination = 'px-3 py-2';

/** Sticky right columns for wide horizontally-scrolling tables */
const stickyAssignBase = 'sticky right-12 z-30 min-w-[88px] max-w-[88px] px-1 py-1 bg-surface-elevated shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.12)]';
const stickyActionsBase = 'sticky right-0 z-30 w-12 min-w-[48px] max-w-[48px] px-0.5 py-1 bg-surface-elevated shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.12)]';

export const stickyAssignTh = `${compactTh} ${stickyAssignBase}`;
export const stickyActionsTh = `${compactTh} ${stickyActionsBase}`;

export function stickyAssignTd(rowIndex) {
  return `px-1 py-1 align-middle text-sm sticky right-12 z-20 min-w-[88px] max-w-[88px] shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)] ${
    rowIndex % 2 === 1 ? 'bg-white dark:bg-slate-800/70' : 'bg-surface'
  } group-hover:bg-brand-500/[0.06]`;
}

export function stickyActionsTd(rowIndex) {
  return `px-0.5 py-1 align-middle text-sm sticky right-0 z-20 w-12 min-w-[48px] max-w-[48px] shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)] ${
    rowIndex % 2 === 1 ? 'bg-white dark:bg-slate-800/70' : 'bg-surface'
  } group-hover:bg-brand-500/[0.06]`;
}
