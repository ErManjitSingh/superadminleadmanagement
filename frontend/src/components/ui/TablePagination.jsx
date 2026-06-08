import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { compactPagination } from './compactTable';

export default function TablePagination({
  table,
  pageIndex,
  pageSize,
  pageCount,
  total,
  onPageChange,
  onPageSizeChange,
  totalLabel = 'items',
  totalCount,
  className = '',
}) {
  const usingTable = !!table;
  const resolvedPageIndex = usingTable ? table.getState().pagination.pageIndex : (pageIndex || 0);
  const resolvedPageSize = usingTable ? table.getState().pagination.pageSize : (pageSize || DEFAULT_PAGE_SIZE);
  const resolvedTotal = usingTable ? (totalCount ?? table.getFilteredRowModel().rows.length) : (total ?? totalCount ?? 0);
  const resolvedPageCount = usingTable ? table.getPageCount() : Math.max(pageCount || 1, 1);
  const from = resolvedTotal === 0 ? 0 : resolvedPageIndex * resolvedPageSize + 1;
  const to = Math.min((resolvedPageIndex + 1) * resolvedPageSize, resolvedTotal);

  const handlePrev = () => {
    if (usingTable) return table.previousPage();
    if (typeof onPageChange === 'function') onPageChange(Math.max(resolvedPageIndex - 1, 0));
  };

  const handleNext = () => {
    if (usingTable) return table.nextPage();
    if (typeof onPageChange === 'function') onPageChange(Math.min(resolvedPageIndex + 1, resolvedPageCount - 1));
  };

  const canPrevious = usingTable ? table.getCanPreviousPage() : resolvedPageIndex > 0;
  const canNext = usingTable ? table.getCanNextPage() : resolvedPageIndex < resolvedPageCount - 1;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${compactPagination} border-t border-subtle bg-surface-elevated/30 ${className}`}>
      <p className="text-sm text-content-muted">
        Showing <span className="font-semibold text-content-primary">{from}–{to}</span> of{' '}
        <span className="font-semibold text-content-primary">{resolvedTotal}</span> {totalLabel}
      </p>
      <div className="flex items-center gap-2">
        {!usingTable && typeof onPageSizeChange === 'function' && (
          <select
            className="h-8 rounded-md border border-subtle bg-surface px-2 text-xs"
            value={resolvedPageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}/page</option>
            ))}
          </select>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrev}
          disabled={!canPrevious}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <span className="text-sm font-medium text-content-secondary px-2 tabular-nums">
          Page {resolvedPageIndex + 1} of {resolvedPageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleNext}
          disabled={!canNext}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export const DEFAULT_PAGE_SIZE = 25;
export const LEADS_PAGE_SIZE = 10;
