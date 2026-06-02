import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Users, Inbox, UserCheck, Flame, XCircle, TrendingUp, Eye, UserPlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import AssignLeadModal from './AssignLeadModal';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import API from '../../api/axios';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useRoleLeadsQuery } from '../../hooks/useRoleLeadsQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import PageHeader from '../ui/PageHeader';
import TablePagination, { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import { compactTable, compactTh, compactTd } from '../ui/compactTable';
import PriorityBadge from './PriorityBadge';
import {
  LeadIdPill,
  SourceBadge,
  DestinationChip,
  BudgetBadge,
  ExecutiveBadge,
  ManagerStatusBadge,
  CustomerCell,
  FILTER_THEMES,
} from './LeadListBadges';

const TITLES = {
  all: { title: 'All Team Leads', desc: 'Complete pipeline across your sales team', icon: Users },
  unassigned: { title: 'Unassigned Leads', desc: 'Leads waiting for executive assignment', icon: Inbox },
  assigned: { title: 'Assigned Leads', desc: 'Leads currently owned by executives', icon: UserCheck },
  hot: { title: 'Hot Leads', desc: 'High budget, urgent travel, and repeat customers', icon: Flame },
  lost: { title: 'Lost Leads', desc: 'Closed-lost opportunities for review', icon: XCircle },
};

const columnHelper = createColumnHelper();

export default function TeamLeadsPage() {
  const queryClient = useQueryClient();
  const { filter = 'all' } = useParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [executives, setExecutives] = useState([]);
  const [assignLead, setAssignLead] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const meta = TITLES[filter] || TITLES.all;
  const theme = FILTER_THEMES[filter] || FILTER_THEMES.all;
  const Icon = meta.icon;

  const { data, isLoading } = useRoleLeadsQuery({
    endpoint: '/sales-manager/leads',
    filter,
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const leads = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);

  const fetchLeads = () => queryClient.invalidateQueries({ queryKey: ['leads', '/sales-manager/leads'] });

  useEffect(() => {
    API.get('/sales-manager/executives').then((r) => setExecutives(r.data)).catch(() => setExecutives([]));
  }, []);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [filter, debouncedSearch]);

  useDataRefresh(['leads'], fetchLeads);

  const handleAssign = async ({ executiveId, leadIds }) => {
    try {
      await API.post('/sales-manager/assign', { executiveId, leadIds });
      setAssignLead(null);
      fetchLeads();
    } catch (err) {
      /* toast via axios */
    }
  };

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [filter, search, leads.length]);

  const columns = useMemo(() => [
    columnHelper.accessor('leadId', {
      header: 'Lead ID',
      cell: (i) => <LeadIdPill id={i.getValue()} />,
    }),
    columnHelper.accessor('name', {
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <CustomerCell name={row.original.name} lead={row.original} />
          <PriorityBadge lead={row.original} />
        </div>
      ),
    }),
    columnHelper.accessor('destination', {
      header: 'Destination',
      cell: (i) => <DestinationChip name={i.getValue()} />,
    }),
    columnHelper.accessor('budget', {
      header: 'Budget',
      cell: (i) => <BudgetBadge amount={i.getValue()} />,
    }),
    columnHelper.accessor('sourceLabel', {
      header: 'Source',
      cell: ({ row }) => <SourceBadge source={row.original.source} label={row.original.sourceLabel} />,
    }),
    columnHelper.accessor('assignedTo', {
      header: 'Executive',
      cell: (i) => <ExecutiveBadge name={i.getValue()?.name} unassigned={!i.getValue()} />,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (i) => <ManagerStatusBadge status={i.getValue()} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/sales-manager/leads/${row.original._id}/view`}
            className="inline-flex items-center h-7 px-2 rounded-md border border-subtle text-[11px] font-medium hover:bg-surface-elevated"
          >
            <Eye className="w-3 h-3 mr-0.5" /> View
          </Link>
          <Button size="sm" variant="gradient" className="h-7 px-2 text-[11px]" onClick={() => setAssignLead(row.original)}>
            <UserPlus className="w-3 h-3 mr-0.5" /> {['lost', 'booked_from_another_company'].includes(row.original.status) ? 'Reassign Lost' : (row.original.assignedTo ? 'Reassign' : 'Assign')}
          </Button>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: leads,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title={meta.title} description={meta.desc} breadcrumbs={['Sales Manager', 'Leads', meta.title]} />

      {/* Colorful filter banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-r ${theme.gradient} p-5 backdrop-blur-xl`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-surface/80 shadow-sm ${theme.icon}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-primary tabular-nums">{isLoading ? '—' : total}</p>
              <p className="text-sm text-content-secondary">{meta.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-500/20">
            <TrendingUp className="w-4 h-4" /> Live pipeline
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-violet-500/20 bg-surface/80 backdrop-blur-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/40 shadow-sm"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border ${theme.border} bg-surface/80 backdrop-blur-xl overflow-hidden shadow-lg shadow-violet-500/5`}
      >
        {isLoading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-content-muted">Loading leads…</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-16 text-center">
            <Icon className={`w-12 h-12 mx-auto mb-3 opacity-40 ${theme.icon}`} />
            <p className="text-content-muted font-medium">No leads in this view</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={compactTable}>
              <colgroup>
                <col className="w-[88px]" />
                <col className="w-[min(150px,16vw)]" />
                <col className="w-[110px]" />
                <col className="w-[90px]" />
                <col className="w-[95px]" />
                <col className="w-[120px]" />
                <col className="w-[100px]" />
                <col className="w-[128px]" />
              </colgroup>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className={`border-b ${theme.border} bg-gradient-to-r ${theme.header}`}>
                    {hg.headers.map((h) => (
                      <th key={h.id} className={compactTh}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`group border-b border-subtle/60 last:border-0 transition-colors hover:bg-violet-500/[0.05] ${row.original.isHot ? 'bg-rose-500/[0.03]' : i % 2 === 1 ? 'bg-surface/40' : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={compactTd}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && leads.length > 0 && (
          <TablePagination table={table} totalLabel="leads" totalCount={total} className={`${theme.border} bg-surface/50`} />
        )}
      </motion.div>

      <AssignLeadModal
        open={!!assignLead}
        lead={assignLead}
        executives={executives}
        onClose={() => setAssignLead(null)}
        onAssign={handleAssign}
      />
    </div>
  );
}
