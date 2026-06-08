import { Link } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Pencil, UserCheck, CalendarPlus, RefreshCw, Trash2 } from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';
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
  stickyAssignTh,
  stickyActionsTh,
  stickyAssignTd,
  stickyActionsTd,
} from '../ui/compactTable';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function LeadDataTable({
  leads,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  onDelete,
  onAssign,
  onTransferBranch,
  canEditLead = true,
  serverPagination = null,
}) {
  const isServer = Boolean(serverPagination);
  const [clientPagination, setClientPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });

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
        cell: ({ getValue }) => <LeadStatusBadge status={getValue()} pulse={getValue() === 'new'} size="sm" />,
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
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => <span className="text-xs text-content-muted whitespace-nowrap">{formatDate(getValue())}</span>,
      },
      {
        id: 'assignedTo',
        accessorKey: 'assignedTo',
        header: 'Assigned To',
        cell: ({ getValue, row }) => {
          const assigned = getValue();
          if (!assigned?.name && onAssign) {
            return (
              <Button
                type="button"
                size="sm"
                variant="gradient"
                className={assignLeadBtnClass}
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(row.original);
                }}
              >
                Assign
              </Button>
            );
          }
          return <ExecutiveBadge name={assigned?.name} unassigned={!assigned?.name} />;
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuRoot>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" className={moreLeadBtnClass}>
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onRowClick(lead)}>
                    <Eye className="w-4 h-4 text-sky-600" /> View Lead
                  </DropdownMenuItem>
                  {canEditLead && (
                    <DropdownMenuItem asChild>
                      <Link to={`/leads/${lead._id}/edit`}><Pencil className="w-4 h-4 text-violet-600" /> Edit Lead</Link>
                    </DropdownMenuItem>
                  )}
                  {onAssign && (
                    <DropdownMenuItem onClick={() => onAssign(lead)}>
                      <UserCheck className="w-4 h-4 text-emerald-600" /> Assign Lead
                    </DropdownMenuItem>
                  )}
                  {onTransferBranch && (
                    <DropdownMenuItem onClick={() => onTransferBranch(lead)}>
                      <RefreshCw className="w-4 h-4 text-fuchsia-600" /> Transfer Branch
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem><CalendarPlus className="w-4 h-4 text-amber-600" /> Add Follow Up</DropdownMenuItem>
                  <DropdownMenuItem><RefreshCw className="w-4 h-4 text-indigo-600" /> Change Status</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(lead._id)}>
                    <Trash2 className="w-4 h-4" /> Delete Lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuRoot>
            </div>
          );
        },
      },
    ],
    [onRowClick, onDelete, onAssign, onTransferBranch, canEditLead]
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
      <div className="overflow-x-auto">
        <table className={`${compactTable} min-w-[1040px]`}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-brand-500/15 bg-gradient-to-r from-brand-600/10 via-violet-600/8 to-indigo-600/10">
                {hg.headers.map((header) => {
                  const colId = header.column.id;
                  const thClass = cn(
                    colId === 'assignedTo' ? stickyAssignTh : colId === 'actions' ? stickyActionsTh : compactTh,
                    'cursor-pointer select-none hover:text-brand-600 transition-colors'
                  );
                  return (
                    <th
                      key={header.id}
                      className={thClass}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                onClick={() => onRowClick(row.original)}
                className={`group border-b border-subtle/50 last:border-0 cursor-pointer transition-all hover:bg-gradient-to-r hover:from-brand-500/[0.06] hover:to-violet-500/[0.04] ${i % 2 === 1 ? 'bg-white dark:bg-slate-800/70' : 'bg-transparent'}`}
              >
                {row.getVisibleCells().map((cell) => {
                  const colId = cell.column.id;
                  const tdClass =
                    colId === 'assignedTo'
                      ? stickyAssignTd(i)
                      : colId === 'actions'
                        ? stickyActionsTd(i)
                        : compactTd;
                  return (
                    <td key={cell.id} className={tdClass}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {isServer ? (
        <TablePagination
          pageIndex={serverPagination.pageIndex}
          pageSize={serverPagination.pageSize}
          pageCount={serverPagination.pageCount}
          total={serverPagination.total}
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
