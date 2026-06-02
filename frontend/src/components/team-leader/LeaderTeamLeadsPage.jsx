import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Users, MoreHorizontal, Eye, MessageSquare, AlertTriangle, UserPlus } from 'lucide-react';
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
} from '@tanstack/react-table';
import API from '../../api/axios';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useRoleLeadsQuery } from '../../hooks/useRoleLeadsQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import PageHeader from '../ui/PageHeader';
import TablePagination, { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import { Button } from '../ui/button';
import PriorityBadge from '../sales-manager/PriorityBadge';
import {
  DestinationChip, BudgetBadge, ExecutiveBadge, ManagerStatusBadge, CustomerCell,
} from '../sales-manager/LeadListBadges';
import { formatFollowUpDate } from './leaderUtils';
import { toast } from '../../context/ToastContext';
import { useLeadAssign } from '../../hooks/useLeadAssign';
import AdminAssignLeadModal from '../leads/AdminAssignLeadModal';
import MyTeamPanel from './MyTeamPanel';
import {
  DropdownMenuRoot, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const columnHelper = createColumnHelper();

import AppModal from '../ui/AppModal';

export function ActionModal({ open, title, onClose, children }) {
  return (
    <AppModal open={open} onClose={onClose} size="md" className="p-6">
      <h3 className="text-lg font-bold text-content-primary mb-4">{title}</h3>
      {children}
    </AppModal>
  );
}

export default function LeaderTeamLeadsPage() {
  const queryClient = useQueryClient();
  const [myTeam, setMyTeam] = useState({ team: null, members: [], message: null });
  const [teamLoading, setTeamLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [modal, setModal] = useState(null);
  const [text, setText] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });

  const { data, isLoading } = useRoleLeadsQuery({
    endpoint: '/team-leader/leads',
    filter,
    search: debouncedSearch,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const leads = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize) || 1);

  const fetchLeads = () => queryClient.invalidateQueries({ queryKey: ['leads', '/team-leader/leads'] });

  const refreshAfterAssign = useCallback(() => {
    fetchLeads();
  }, [queryClient]);

  const {
    assignees,
    assigneesLoading,
    assignModal,
    openAssign,
    closeAssign,
    handleAssign,
    assignConfirmDialog,
  } = useLeadAssign({ onAssigned: refreshAfterAssign });

  useEffect(() => {
    setTeamLoading(true);
    API.get('/team-leader/my-team')
      .then((r) => setMyTeam(r.data || { team: null, members: [], message: null }))
      .catch(() => setMyTeam({ team: null, members: [], message: 'Could not load team' }))
      .finally(() => setTeamLoading(false));
  }, []);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch, filter]);

  useDataRefresh(['leads'], fetchLeads);

  const handleComment = async () => {
    if (!modal?.lead || !text.trim()) return;
    await API.post(`/team-leader/leads/${modal.lead._id}/comment`, { text });
    setModal(null);
    setText('');
    fetchLeads();
  };

  const handleEscalate = async (lead) => {
    await API.post('/team-leader/escalations', { _id: lead._id, leadName: lead.name, type: 'stuck' });
    toast.success(`${lead.name} escalated to Sales Manager`);
  };

  const columns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Customer',
      cell: ({ row }) => (
        <div className="space-y-1">
          <CustomerCell name={row.original.name} lead={row.original} />
          {row.original.isHot && <PriorityBadge lead={row.original} />}
        </div>
      ),
    }),
    columnHelper.accessor('destination', { header: 'Destination', cell: (i) => <DestinationChip name={i.getValue()} /> }),
    columnHelper.accessor('assignedTo', { header: 'Executive', cell: (i) => <ExecutiveBadge name={i.getValue()?.name} /> }),
    columnHelper.accessor('budget', { header: 'Budget', cell: (i) => <BudgetBadge amount={i.getValue()} /> }),
    columnHelper.accessor('status', { header: 'Status', cell: (i) => <ManagerStatusBadge status={i.getValue()} /> }),
    columnHelper.accessor('nextFollowUp', { header: 'Next Follow-up', cell: (i) => <span className="text-xs">{formatFollowUpDate(i.getValue())}</span> }),
    columnHelper.accessor('priority', { header: 'Priority', cell: ({ row }) => <PriorityBadge lead={row.original} /> }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenuRoot>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link to={`/team-leader/leads/${row.original._id}/view`} className="flex items-center gap-2 cursor-pointer">
                <Eye className="w-4 h-4" /> View Lead
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setModal({ type: 'comment', lead: row.original }); setText(''); }} className="flex items-center gap-2 cursor-pointer">
              <MessageSquare className="w-4 h-4" /> Add Comment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEscalate(row.original)} className="flex items-center gap-2 cursor-pointer">
              <AlertTriangle className="w-4 h-4" /> Escalate Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openAssign(row.original)} className="flex items-center gap-2 cursor-pointer">
              <UserPlus className="w-4 h-4" /> {['lost', 'booked_from_another_company'].includes(row.original.status) ? 'Reassign Lost Lead' : 'Assign to Executive'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      ),
    }),
  ], []);

  const table = useReactTable({ data: leads, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-6">
      <PageHeader title="Team Leads" description="Leads assigned to your squad — coach and convert" breadcrumbs={['Team Leader', 'Team Leads']} />

      <MyTeamPanel
        team={myTeam.team}
        members={myTeam.members}
        message={myTeam.message}
        loading={teamLoading}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-indigo-500/15 p-5"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-surface/80 text-amber-600"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{isLoading ? '—' : total}</p>
            <p className="text-sm text-content-secondary">Team pipeline leads</p>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer, destination, executive…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>
      <div className="max-w-xs">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm"
        >
          <option value="all">All Team Leads</option>
          <option value="lost">Lost Leads</option>
          <option value="reactivated">Reactivated Leads</option>
          <option value="assigned">Assigned Leads</option>
          <option value="unassigned">Unassigned Leads</option>
          <option value="hot">Hot Leads</option>
        </select>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                <tr><td colSpan={columns.length} className="p-12 text-center text-content-muted">No team leads found</td></tr>
              ) : table.getRowModel().rows.map((row, i) => (
                <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-amber-500/[0.03]">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pageCount}
          total={total}
          onPageChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
          onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
        />
      </div>

      <ActionModal open={modal?.type === 'comment'} title="Add Comment" onClose={() => setModal(null)}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Team leader note…" className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4" />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleComment}>Save</Button>
        </div>
      </ActionModal>

      <AdminAssignLeadModal
        open={!!assignModal}
        lead={assignModal}
        assignees={assignees}
        loading={assigneesLoading}
        onClose={closeAssign}
        onAssign={handleAssign}
        allowedRoles={['sales_executive']}
      />
      {assignConfirmDialog}
    </div>
  );
}
