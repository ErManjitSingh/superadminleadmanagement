import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import API from '../../api/axios';
import { isLeadStatusLocked } from '../../utils/leadUtils';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useRoleLeadsQuery } from '../../hooks/useRoleLeadsQuery';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import { Button } from '../ui/button';
import {
  executiveCard,
  executiveCardHover,
  executiveInput,
  executiveIconAccent,
} from './executivePageStyles';
import PriorityBadge from '../sales-manager/PriorityBadge';
import {
  LeadIdPill,
  DestinationChip,
  BudgetBadge,
  ManagerStatusBadge,
  CustomerCell,
} from '../sales-manager/LeadListBadges';
import { LEAD_FILTERS, formatTravelDate, formatFollowUpDate } from './executiveUtils';
import LeadActionsMenu, { ActionModal } from './LeadActionsMenu';
import VirtualizedRoleTable from '../ui/VirtualizedRoleTable';
import { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import AddFollowUpModal from '../followups/AddFollowUpModal';
import { createExecutiveFollowUp, buildFollowUpPayload } from '../followups/followupApi';
import { LEAD_STATUSES, DESTINATIONS } from '../leads/constants';
import MyLeadsHero from './my-leads/MyLeadsHero';
import MyLeadsKpiStrip from './my-leads/MyLeadsKpiStrip';
import MyLeadsRightRail from './my-leads/MyLeadsRightRail';

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
  const debouncedSearch = useDebouncedValue(search, 500);
  const [statusFilter, setStatusFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [modal, setModal] = useState(null);
  const [modalStatus, setModalStatus] = useState('contacted');
  const [modalStatusReason, setModalStatusReason] = useState('');

  const meta = LEAD_FILTERS[filter] || LEAD_FILTERS.new;
  const isAllView = filter === 'all';

  const { data: dashData, isLoading: dashLoading } = useDashboardQuery('/sales-executive/dashboard');

  const { data, isLoading } = useRoleLeadsQuery({
    endpoint: '/sales-executive/leads',
    filter,
    search: debouncedSearch,
    skipDebounce: true,
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
      setShowMoreFilters(false);
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

  const columns = useMemo(
    () => [
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
            canChangeStatus={!isLeadStatusLocked(row.original.status)}
            onScheduleFollowUp={(lead) => {
              setModal({ type: 'followup', lead });
            }}
            onChangeStatus={(lead) => {
              setModal({ type: 'status', lead });
              setModalStatus(lead.status);
              setModalStatusReason(lead.statusReason || '');
            }}
          />
        ),
      }),
    ],
    []
  );

  const filterBar = (
    <div className={`${executiveCard} p-3 sm:p-4`}>
      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${executiveIconAccent}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, destination, phone…"
            className={`w-full pl-10 pr-4 py-2.5 ${executiveInput}`}
          />
        </div>

        {isAllView && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`h-10 px-3 min-w-[140px] ${executiveInput}`}
            >
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className={`h-10 px-3 min-w-[150px] ${executiveInput}`}
            >
              <option value="">All destinations</option>
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={`h-10 px-3 min-w-[130px] ${executiveInput}`}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value || 'all'} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              className="h-10 rounded-xl gap-1.5"
              onClick={() => setShowMoreFilters((v) => !v)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
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
                Clear
              </Button>
            )}
          </div>
        )}
      </div>
      {showMoreFilters && isAllView && (
        <p className="text-xs text-content-muted mt-3">
          Tip: combine status, destination, and priority filters to narrow your pipeline.
        </p>
      )}
    </div>
  );

  const tableBlock = (
    <div className={`${executiveCard} overflow-hidden`}>
      <VirtualizedRoleTable
        data={leads}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        pageCount={pageCount}
        total={total}
        onPaginationChange={setPagination}
        rowClassName={executiveCardHover}
      />
    </div>
  );

  const modals = (
    <>
      <ActionModal open={modal?.type === 'status'} title="Change Status" onClose={() => setModal(null)}>
        <select
          value={modalStatus}
          onChange={(e) => setModalStatus(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-surface-elevated p-3 text-sm mb-4"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <textarea
          value={modalStatusReason}
          onChange={(e) => setModalStatusReason(e.target.value)}
          rows={3}
          placeholder="Reason for status change"
          className="w-full rounded-xl border border-subtle bg-white dark:bg-slate-900 p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setModal(null);
              setModalStatusReason('');
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleChangeStatus} disabled={reasonRequired && !modalStatusReason.trim()}>
            Update
          </Button>
        </div>
      </ActionModal>

      <AddFollowUpModal
        open={modal?.type === 'followup'}
        onClose={() => setModal(null)}
        fixedLeadId={modal?.lead?._id}
        fixedLeadName={modal?.lead?.name}
        onSubmit={async (formData) => {
          await createExecutiveFollowUp(buildFollowUpPayload({ ...formData, lead: modal.lead._id }));
          setModal(null);
          fetchLeads();
        }}
      />
    </>
  );

  return (
    <div className="pb-8">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-5 w-full">
          <MyLeadsHero title={meta.title} description={meta.desc} />
          <MyLeadsKpiStrip
            kpis={dashData?.kpis}
            trends={dashData?.kpiTrends}
            isLoading={dashLoading && !dashData}
          />
          {filterBar}
          {tableBlock}
        </div>

        <div className="w-full xl:w-[300px] 2xl:w-[320px] shrink-0">
          <MyLeadsRightRail data={dashData} />
        </div>
      </div>
      {modals}
    </div>
  );
}
