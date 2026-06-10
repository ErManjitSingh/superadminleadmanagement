import { Link } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Eye, Pencil, UserCheck, RefreshCw, Trash2 } from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';
import LeadTemperatureBadge from './LeadTemperatureBadge';
import { formatLeadId } from './constants';
import {
  SourceBadge,
  DestinationChip,
  BudgetBadge,
  TravelersBadge,
  LeadIdPill,
  CustomerCell,
  ExecutiveBadge,
  assignLeadBtnClass,
  moreLeadBtnClass,
  moreLeadBtnSoloClass,
  AssignedExecutiveChip,
} from '../sales-manager/LeadListBadges';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import TablePagination, { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import { cn } from '../../lib/utils';
import {
  compactTable,
  compactTh,
  compactTd,
  stickyRowActionsTh,
  stickyRowActionsTd,
} from '../ui/compactTable';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const defaultMenuActions = {
  view: true,
  edit: true,
  assign: true,
  transferBranch: true,
  delete: true,
};

export default function LeadDataTable({
  leads,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  onDelete,
  onAssign,
  onTransferBranch,
  canEditLead = true,
  menuActions = defaultMenuActions,
  showAssignButton = true,
  serverPagination = null,
}) {
  const actions = { ...defaultMenuActions, ...menuActions };
  const isServer = Boolean(serverPagination);
  const [clientPagination, setClientPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const scrollRef = useRef(null);

  const pagination = isServer
    ? { pageIndex: serverPagination.pageIndex, pageSize: serverPagination.pageSize }
    : clientPagination;

  useEffect(() => {
    if (!isServer) {
      setClientPagination((p) => ({ ...p, pageIndex: 0 }));
    }
  }, [leads.length, isServer]);

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-brand-400/40 accent-brand-600"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-brand-400/40 accent-brand-600"
          />
        ),
        size: 40,
      },
      {
        accessorKey: 'id',
        header: 'Lead ID',
        cell: ({ row }) => <LeadIdPill id={formatLeadId(row.original._id)} />,
      },
      {
        accessorKey: 'name',
        header: 'Customer',
        cell: ({ row }) => <CustomerCell name={row.original.name} />,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ getValue }) => <span className="text-sm text-content-secondary whitespace-nowrap">{getValue()}</span>,
      },
      {
        accessorKey: 'destination',
        header: 'Destination',
        cell: ({ getValue }) => <DestinationChip name={getValue()} />,
      },
      {
        accessorKey: 'travelDate',
        header: 'Travel Date',
        cell: ({ getValue }) => (
          <span className="text-xs px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-400/25 whitespace-nowrap">
            {formatDate(getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'budget',
        header: 'Budget',
        cell: ({ getValue }) => <BudgetBadge amount={getValue()} />,
      },
      {
        accessorKey: 'travelers',
        header: 'Pax',
        cell: ({ row }) => (
          <TravelersBadge
            travelers={row.original.travelers}
            adults={row.original.adults}
            children={row.original.children}
          />
        ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <SourceBadge
            source={row.original.source}
            label={row.original.sourceLabel}
            sourceShort={row.original.sourceShort}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row, getValue }) => (
          <div className="flex flex-wrap items-center gap-1">
            <LeadStatusBadge status={getValue()} pulse={getValue() === 'new'} size="sm" />
            <LeadTemperatureBadge temperature={row.original.temperature} />
          </div>
        ),
      },
      {
        accessorKey: 'lastFollowUp',
        header: 'Last Follow Up',
        cell: ({ getValue }) => <span className="text-xs text-violet-600/80 whitespace-nowrap">{formatDateTime(getValue())}</span>,
      },
      {
        accessorKey: 'nextFollowUp',
        header: 'Next Follow Up',
        cell: ({ getValue }) => (
          <span className={`text-xs whitespace-nowrap px-2 py-0.5 rounded-md ${getValue() ? 'font-medium bg-amber-500/10 text-amber-700' : 'text-content-muted'}`}>
            {formatDateTime(getValue())}
          </span>
        ),
      },
      {
        id: 'assignedTo',
        accessorKey: 'assignedTo',
        header: 'Assigned To',
        cell: ({ getValue }) => (
          <ExecutiveBadge name={getValue()?.name} unassigned={!getValue()?.name} />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => <span className="text-xs text-content-muted whitespace-nowrap">{formatDate(getValue())}</span>,
      },
      {
        id: 'rowActions',
        header: '',
        cell: ({ row }) => {
          const lead = row.original;
          const assignedName = lead.assignedTo?.name;
          const showAssign = showAssignButton && actions.assign && !assignedName && onAssign;
          const showAssignedName = Boolean(assignedName);
          const showEdit = actions.edit && canEditLead;
          const showAssignMenu = actions.assign && onAssign;
          const showTransfer = actions.transferBranch && onTransferBranch;
          const showDelete = actions.delete && onDelete;
          const hasMenuItems = actions.view || showEdit || showAssignMenu || showTransfer || showDelete;

          return (
            <div className="inline-flex items-stretch justify-end gap-0 isolate" onClick={(e) => e.stopPropagation()}>
              {showAssign && (
                <Button
                  type="button"
                  size="sm"
                  variant="gradient"
                  className={assignLeadBtnClass}
                  onClick={() => onAssign(lead)}
                >
                  Assign
                </Button>
              )}
              {showAssignedName && !showAssign && (
                <AssignedExecutiveChip name={assignedName} />
              )}
              {hasMenuItems && (
                <DropdownMenuRoot>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={showAssign || showAssignedName ? moreLeadBtnClass : moreLeadBtnSoloClass}
                    >
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {actions.view && (
                      <DropdownMenuItem onClick={() => onRowClick(lead)}>
                        <Eye className="w-4 h-4 text-sky-600" /> View Lead
                      </DropdownMenuItem>
                    )}
                    {showEdit && (
                      <DropdownMenuItem asChild>
                        <Link to={`/leads/${lead._id}/edit`}><Pencil className="w-4 h-4 text-violet-600" /> Edit Lead</Link>
                      </DropdownMenuItem>
                    )}
                    {showAssignMenu && (
                      <DropdownMenuItem onClick={() => onAssign(lead)}>
                        <UserCheck className="w-4 h-4 text-emerald-600" /> Assign Lead
                      </DropdownMenuItem>
                    )}
                    {showTransfer && (
                      <DropdownMenuItem onClick={() => onTransferBranch(lead)}>
                        <RefreshCw className="w-4 h-4 text-fuchsia-600" /> Transfer Branch
                      </DropdownMenuItem>
                    )}
                    {showDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(lead._id)}>
                          <Trash2 className="w-4 h-4" /> Delete Lead
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenuRoot>
              )}
            </div>
          );
        },
      },
    ],
    [onRowClick, onDelete, onAssign, onTransferBranch, canEditLead, actions, showAssignButton]
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { rowSelection, pagination },
    onRowSelectionChange,
    onPaginationChange: isServer ? serverPagination.onPaginationChange : setClientPagination,
    manualPagination: isServer,
    pageCount: isServer ? serverPagination.pageCount : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(isServer ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getRowId: (row) => row._id,
    enableRowSelection: true,
  });

  const tableRows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 6,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-violet-500/5 p-16 text-center backdrop-blur-xl">
        <p className="text-content-muted font-medium">No leads match your filters</p>
        <p className="text-sm text-content-muted mt-1">Try adjusting filters or add a new lead</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-500/20 bg-surface/90 backdrop-blur-xl shadow-lg shadow-brand-500/5 overflow-hidden">
      <div ref={scrollRef} className="overflow-auto max-h-[min(70vh,640px)]">
        <table className={`${compactTable} min-w-[1040px]`}>
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-brand-500/15 bg-gradient-to-r from-brand-600/10 via-violet-600/8 to-indigo-600/10">
                {hg.headers.map((header) => {
                  const colId = header.column.id;
                  const thClass = cn(
                    colId === 'rowActions' ? stickyRowActionsTh : compactTh,
                    colId !== 'rowActions' && 'cursor-pointer select-none hover:text-brand-600 transition-colors'
                  );
                  return (
                    <th
                      key={header.id}
                      className={thClass}
                      onClick={colId !== 'rowActions' ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="isolate">
            {paddingTop > 0 && (
              <tr aria-hidden>
                <td colSpan={columns.length} style={{ height: paddingTop, padding: 0, border: 0 }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              const i = virtualRow.index;
              const even = i % 2 === 0;
              const rowBg = even ? 'bg-surface' : 'bg-white dark:bg-slate-800';
              const rowHover = even
                ? 'hover:bg-slate-50 dark:hover:bg-slate-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700';
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
                  className={`group relative z-0 hover:z-[5] border-b border-subtle/50 last:border-0 cursor-pointer transition-colors ${rowBg} ${rowHover}`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colId = cell.column.id;
                    const tdClass = colId === 'rowActions' ? stickyRowActionsTd(i) : compactTd;
                    return (
                      <td key={cell.id} className={tdClass}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr aria-hidden>
                <td colSpan={columns.length} style={{ height: paddingBottom, padding: 0, border: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isServer ? (
        <TablePagination
          pageIndex={serverPagination.pageIndex}
          pageSize={serverPagination.pageSize}
          pageCount={serverPagination.pageCount}
          total={serverPagination.total}
          hasMore={serverPagination.hasMore}
          onPageChange={(pageIndex) =>
            serverPagination.onPaginationChange((prev) => ({ ...prev, pageIndex }))
          }
          totalLabel="leads"
          className="border-brand-500/15 bg-gradient-to-r from-brand-500/[0.03] to-violet-500/[0.03]"
        />
      ) : (
        <TablePagination
          table={table}
          totalLabel="leads"
          className="border-brand-500/15 bg-gradient-to-r from-brand-500/[0.03] to-violet-500/[0.03]"
        />
      )}
    </div>
  );
}
