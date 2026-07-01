import { useEffect, useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { MapPin, Clock, Copy, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { PACKAGE_TYPES } from '../quotations/constants';
import { PACKAGE_STATUS_OPTIONS } from './builder/packageBuilderConstants';
import { formatINR } from '../quotations/quotationUtils';
import { cn } from '../../lib/utils';
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
import { compactTable, compactTh, compactTd } from '../ui/compactTable';

function formatDateTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

function packageCode(pkg) {
  if (pkg.packageCode) return pkg.packageCode;
  const id = String(pkg._id || '');
  return `PKG-${id.slice(-5).toUpperCase()}`;
}

const TYPE_BADGE = {
  honeymoon: 'bg-rose-500/12 text-rose-700 border-rose-300/40',
  family: 'bg-sky-500/12 text-sky-700 border-sky-300/40',
  group: 'bg-violet-500/12 text-violet-700 border-violet-300/40',
  adventure: 'bg-emerald-500/12 text-emerald-700 border-emerald-300/40',
  luxury: 'bg-amber-500/12 text-amber-800 border-amber-300/40',
  corporate: 'bg-slate-500/12 text-slate-700 border-slate-300/40',
  weekend: 'bg-cyan-500/12 text-cyan-700 border-cyan-300/40',
};

const STATUS_BADGE = {
  published: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30',
  draft: 'bg-amber-500/15 text-amber-800 border-amber-400/30',
  hidden: 'bg-slate-500/15 text-slate-600 border-slate-400/30',
  archived: 'bg-red-500/10 text-red-700 border-red-400/30',
};

function TypeBadge({ type }) {
  const cfg = PACKAGE_TYPES.find((t) => t.value === type) || PACKAGE_TYPES[1];
  return (
    <span className={cn('inline-flex text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border', TYPE_BADGE[type] || TYPE_BADGE.family)}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = PACKAGE_STATUS_OPTIONS.find((s) => s.value === status) || PACKAGE_STATUS_OPTIONS[0];
  return (
    <span className={cn('inline-flex text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border', STATUS_BADGE[status] || STATUS_BADGE.draft)}>
      {cfg.label}
    </span>
  );
}

function destinationLine(pkg) {
  const stops = (pkg.destinations || []).map((d) => d.name).filter(Boolean);
  if (stops.length) return `${stops.join(', ')}${pkg.state ? ` · ${pkg.state}` : ''}`;
  return pkg.destination || '—';
}

export default function PackageDataTable({ packages, onEdit, onDelete, onDuplicate }) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [packages.length]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Package',
        cell: ({ row }) => {
          const pkg = row.original;
          const cover = pkg.coverImage || pkg.gallery?.[0] || '';
          return (
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-violet-500/10 shrink-0 border border-violet-500/15">
                {cover ? (
                  <img src={cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🏔</div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-content-primary">{pkg.name}</p>
                <p className="text-[11px] text-violet-600 font-mono mt-0.5">{packageCode(pkg)}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'destination',
        header: 'Destination',
        cell: ({ row }) => (
          <span className="inline-flex items-start gap-1.5 text-sm text-content-secondary max-w-[200px]">
            <MapPin className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{destinationLine(row.original)}</span>
          </span>
        ),
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => {
          const days = row.original.days || row.original.duration || 0;
          const nights = row.original.nights ?? Math.max(0, days - 1);
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-500/12 text-violet-800 ring-1 ring-violet-400/25 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              {days}D / {nights}N
            </span>
          );
        },
      },
      {
        accessorKey: 'packageType',
        header: 'Type',
        cell: ({ getValue }) => <TypeBadge type={getValue()} />,
      },
      {
        accessorKey: 'startingPrice',
        header: 'Starting Price',
        cell: ({ row }) => {
          const price = row.original.pricing?.perPerson || row.original.startingPrice || 0;
          return (
            <div>
              <p className="text-sm font-bold text-content-primary tabular-nums">{formatINR(price)}</p>
              <p className="text-[10px] text-content-muted">Per Person</p>
            </div>
          );
        },
      },
      {
        id: 'bookings',
        header: 'Bookings',
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-content-primary">
            {row.original.bookingCount || 0} <span className="text-content-muted font-normal text-xs">Bookings</span>
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => (
          <span className="text-xs text-content-muted whitespace-nowrap">{formatDateTime(getValue())}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status || 'draft'} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const pkg = row.original;
          return (
            <DropdownMenuRoot>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg hover:bg-violet-500/10 hover:text-violet-600">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(pkg)}>
                  <Pencil className="w-4 h-4 text-violet-600" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(pkg._id)}>
                  <Copy className="w-4 h-4 text-sky-600" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(pkg._id)}>
                  <Trash2 className="w-4 h-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuRoot>
          );
        },
      },
    ],
    [onEdit, onDelete, onDuplicate]
  );

  const table = useReactTable({
    data: packages,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row._id,
  });

  if (packages.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className={`${compactTable} min-w-[1100px]`}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-violet-500/10 bg-gradient-to-r from-violet-600/8 via-indigo-600/6 to-violet-600/8">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`${compactTh} cursor-pointer select-none hover:text-violet-600 transition-colors`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'group border-b border-subtle/40 last:border-0 transition-all hover:bg-violet-500/[0.04]',
                  i % 2 === 1 && 'bg-slate-50/50 dark:bg-slate-800/30'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={compactTd}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        table={table}
        totalLabel="packages"
        className="border-violet-500/10 bg-gradient-to-r from-violet-500/[0.03] to-indigo-500/[0.03]"
      />
    </>
  );
}
