import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, Phone, CalendarClock, Flame, Trophy, XCircle, TrendingUp, RefreshCw, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
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
import { Button } from '../ui/button';
import PriorityBadge from '../sales-manager/PriorityBadge';
import {
  LeadIdPill,
  DestinationChip,
  BudgetBadge,
  ManagerStatusBadge,
  CustomerCell,
} from '../sales-manager/LeadListBadges';
import { LEAD_FILTERS, EXEC_FILTER_THEMES, formatTravelDate, formatFollowUpDate } from './executiveUtils';
import LeadActionsMenu, { ActionModal } from './LeadActionsMenu';
import { compactTable, compactTh, compactTd } from '../ui/compactTable';
import TablePagination, { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import AddFollowUpModal from '../followups/AddFollowUpModal';
import { createExecutiveFollowUp, buildFollowUpPayload } from '../followups/followupApi';
import { LEAD_STATUSES, DESTINATIONS } from '../leads/constants';

const ICONS = { Sparkles, Phone, CalendarClock, Flame, Trophy, XCircle, RefreshCw, Users };

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'hot', label: 'Hot leads' },
  { value: 'high', label: 'High priority' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUSES = [
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'converted',
  'lost',
  'booked_from_another_company',
];

const columnHelper = createColumnHelper();

export default function MyLeadsPage() {
  const queryClient = useQueryClient();
  const { filter = 'new' } = useParams();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [statusFilter, setStatusFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [modal, setModal] = useState(null);
  const [modalStatus, setModalStatus] = useState('contacted');
  const [modalStatusReason, setModalStatusReason] = useState('');

  const meta = LEAD_FILTERS[filter] || LEAD_FILTERS.new;
  const theme = EXEC_FILTER_THEMES[filter] || EXEC_FILTER_THEMES.new;
  const Icon = ICONS[meta.icon] || Sparkles;

  const isAllView = filter === 'all';

  const { data, isLoading } = useRoleLeadsQuery({
    endpoint: '/sales-executive/leads',
    filter,
    search: debouncedSearch,
    status: isAllView ? statusFilter : '',
    destination: isAllView ? destinationFilter : '',
    priority: isAllView ? priorityFilter : '',
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const leads = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);

  const fetchLeads = () => queryClient.invalidateQueries({ queryKey: ['leads', '/sales-executive/leads'] });

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [filter, debouncedSearch, statusFilter, destinationFilter, priorityFilter]);

  useEffect(() => {
    if (!isAllView) {
      setStatusFilter('');
      setDestinationFilter('');
      setPriorityFilter('');
    }
  }, [isAllView]);

  useDataRefresh(['leads'], fetchLeads);

  const handleChangeStatus = async () => {
    if (!modal?.lead) return;
    await API.put(`/sales-executive/leads/${modal.lead._id}`, {
      status: modalStatus,
      statusReason: modalStatusReason,
    });
    setModal(null);
    setModalStatusReason('');
    fetchLeads();
  };
  const reasonRequired = ['lost', 'booked_from_another_company'].includes(modalStatus);

  const columns = useMemo(() => [
    columnHelper.accessor('leadId', {
      header: 'Lead ID',
      cell: (i) => <LeadIdPill id={i.getValue()} />,
    }),
    columnHelper.accessor('name', {
      header: 'Customer Name',
      cell: ({ row }) => (
        <div className="space-y-1.5">
          <Link
            to={`/sales-executive/leads/${row.original._id}/view`}
            className="block rounded-lg -m-1 p-1 hover:bg-sky-500/5 transition-colors"
          >
            <CustomerCell name={row.original.name} lead={row.original} />
          </Link>
          {row.original.isHot && <PriorityBadge lead={row.original} />}
        </div>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (i) => <span className="text-xs text-content-secondary font-mono">{i.getValue()}</span>,
    }),
    columnHelper.accessor('destination', {
      header: 'Destination',
      cell: (i) => <DestinationChip name={i.getValue()} />,
    }),
    columnHelper.accessor('travelDate', {
      header: 'Travel Date',
      cell: (i) => <span className="text-xs text-content-secondary">{formatTravelDate(i.getValue())}</span>,
    }),
    columnHelper.accessor('budget', {
      header: 'Budget',
      cell: (i) => <BudgetBadge amount={i.getValue()} />,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => <ManagerStatusBadge status={row.original.status} lead={row.original} />,
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: ({ row }) => <PriorityBadge lead={row.original} />,
    }),
    columnHelper.accessor('nextFollowUp', {
      header: 'Next Follow-up',
      cell: (i) => <span className="text-xs text-content-secondary">{formatFollowUpDate(i.getValue())}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <LeadActionsMenu
          lead={row.original}
          onScheduleFollowUp={(lead) => { setModal({ type: 'followup', lead }); }}
          onChangeStatus={(lead) => {
            setModal({ type: 'status', lead });
            setModalStatus(lead.status);
            setModalStatusReason(lead.statusReason || '');
          }}
        />
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
      <PageHeader title={meta.title} description={meta.desc} breadcrumbs={['Sales Executive', 'My Leads', meta.title]} />

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
          {filter === 'hot' && (
            <div className="text-xs text-content-secondary max-w-sm">
              Auto-highlighted: budget &gt; ₹50K · travel within 30 days · repeat customers
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-500/20">
            <TrendingUp className="w-4 h-4" /> Your pipeline
          </div>
        </div>
      </motion.div>

      <div className={`flex flex-col gap-3 ${isAllView ? '' : 'max-w-md'}`}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, destination, phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
        </div>
        {isAllView && (
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-subtle bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-subtle bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="">All destinations</option>
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-subtle bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value || 'all'} value={p.value}>{p.label}</option>
              ))}
            </select>
            {(statusFilter || destinationFilter || priorityFilter) && (
              <Button
                type="button"
                variant="secondary"
                className="h-10 rounded-xl"
                onClick={() => {
                  setStatusFilter('');
                  setDestinationFilter('');
                  setPriorityFilter('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className={compactTable}>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-subtle bg-surface-elevated/50">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="text-left px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-content-muted whitespace-nowrap">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-subtle">
              {isLoading ? (
                <tr><td colSpan={columns.length} className="p-12 text-center text-content-muted">Loading…</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={columns.length} className="p-12 text-center text-content-muted">No leads in this view</td></tr>
              ) : table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-sky-500/[0.03]"
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
        {!isLoading && leads.length > 0 && (
          <TablePagination table={table} totalLabel="leads" totalCount={total} />
        )}
      </div>

      <ActionModal open={modal?.type === 'status'} title="Change Status" onClose={() => setModal(null)}>
        <select
          value={modalStatus}
          onChange={(e) => setModalStatus(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <textarea
          value={modalStatusReason}
          onChange={(e) => setModalStatusReason(e.target.value)}
          rows={3}
          placeholder="Reason for status change"
          className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setModal(null); setModalStatusReason(''); }}>Cancel</Button>
          <Button onClick={handleChangeStatus} disabled={reasonRequired && !modalStatusReason.trim()}>Update</Button>
        </div>
      </ActionModal>

      <AddFollowUpModal
        open={modal?.type === 'followup'}
        onClose={() => setModal(null)}
        fixedLeadId={modal?.lead?._id}
        fixedLeadName={modal?.lead?.name}
        onSubmit={async (data) => {
          await createExecutiveFollowUp(buildFollowUpPayload({ ...data, lead: modal.lead._id }));
          setModal(null);
          fetchLeads();
        }}
      />
    </div>
  );
}
