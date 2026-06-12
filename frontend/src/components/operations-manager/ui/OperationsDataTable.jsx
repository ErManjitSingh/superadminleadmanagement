import { Inbox } from 'lucide-react';
import { cn } from '../../../lib/utils';

function TableSkeleton({ columns }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-subtle/60 last:border-0">
          {columns.map((col) => (
            <td key={col.key} className="px-5 py-4">
              <div className="h-4 rounded-md bg-surface-elevated animate-pulse" style={{ width: col.skeletonWidth || '70%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function OperationsDataTable({
  columns,
  data = [],
  rowKey = (row, i) => row._id || row.id || i,
  loading = false,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No records found',
  emptyDescription,
  className,
  footer,
  onRowClick,
  compact = false,
}) {
  const cellPy = compact ? 'py-3' : 'py-4';
  const headPy = compact ? 'py-3' : 'py-3.5';

  return (
    <div
      className={cn(
        'rounded-3xl border border-subtle/80 bg-gradient-to-b from-surface via-surface/95 to-surface/80',
        'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(13,148,136,0.06)] overflow-hidden',
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-teal-500/10 bg-gradient-to-r from-teal-500/[0.06] via-surface-elevated/95 to-surface-elevated/90">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'text-left px-5 text-[10px] font-bold uppercase tracking-[0.08em] text-content-muted/90 whitespace-nowrap',
                    headPy,
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/70">
            {loading ? (
              <TableSkeleton columns={columns} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-20 text-center">
                  <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    <div className="p-4 rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/15">
                      <EmptyIcon className="w-8 h-8 text-teal-600/80" />
                    </div>
                    <div>
                      <p className="font-semibold text-content-primary">{emptyTitle}</p>
                      {emptyDescription && (
                        <p className="text-sm text-content-muted mt-1">{emptyDescription}</p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'group transition-all duration-150',
                    'hover:bg-teal-500/[0.04] hover:shadow-[inset_3px_0_0_0_rgb(13,148,136)]',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-5 text-sm text-content-primary align-middle', cellPy, col.className)}
                    >
                      {col.render ? col.render(row, i) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer && !loading && data.length > 0 && (
        <div className="px-5 py-3 border-t border-subtle/80 bg-surface-elevated/40 text-xs text-content-muted">
          {footer}
        </div>
      )}
    </div>
  );
}
