import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import AdminAssignLeadModal from '../components/leads/AdminAssignLeadModal';
import { useLeadAssign } from '../hooks/useLeadAssign';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import API from '../api/axios';
import { toast } from '../context/ToastContext';
import { normalizeLeadStatus } from '../utils/leadUtils';
import LeadPageHeader from '../components/leads/LeadPageHeader';
import LeadFilterBar from '../components/leads/LeadFilterBar';
import LeadBulkActionsBar from '../components/leads/LeadBulkActionsBar';
import LeadDataTable from '../components/leads/LeadDataTable';
import LeadKanbanBoard from '../components/leads/LeadKanbanBoard';
import LeadPreviewDrawer from '../components/leads/LeadPreviewDrawer';
import { KANBAN_COLUMNS, pageConfig, emptyFilters } from '../components/leads/constants';
import { groupLeadsByStatus, countActiveFilters } from '../components/leads/leadFilters';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useLeadsQuery, useLeadsKanbanQuery } from '../features/leads/hooks/useLeadsQuery';
import { DEFAULT_PAGE_SIZE } from '../components/ui/TablePagination';

export default function Leads() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { can } = usePermissions();
  const isAdmin = user?.role === 'admin';
  const canEditLead = can('leads', 'edit');
  const config = pageConfig[location.pathname] || pageConfig['/leads'];

  const [view, setView] = useState('table');
  const [filters, setFilters] = useState({ ...emptyFilters, status: config.status || '' });
  const [appliedFilters, setAppliedFilters] = useState({ ...emptyFilters, status: config.status || '' });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const [rowSelection, setRowSelection] = useState({});
  const [previewLead, setPreviewLead] = useState(null);
  const [activeDragLead, setActiveDragLead] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const apiFilters = useMemo(() => {
    const base = { ...appliedFilters };
    if (config.status && !base.status) base.status = config.status;
    if (config.assignee === 'unassigned') base.filter = 'unassigned';
    else if (config.assignee === 'assigned') base.filter = 'assigned';
    return base;
  }, [appliedFilters, config.status, config.assignee]);

  const tableQuery = useLeadsQuery({
    filters: apiFilters,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    enabled: view === 'table',
  });

  const kanbanQuery = useLeadsKanbanQuery({
    filters: apiFilters,
    enabled: view === 'kanban',
  });

  const invalidateLeads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  }, [queryClient]);

  useDataRefresh(['leads'], invalidateLeads);

  useEffect(() => {
    setFilters((f) => ({ ...f, status: config.status || '' }));
    setAppliedFilters((f) => ({ ...f, status: config.status || '' }));
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [config.status, config.assignee, location.pathname]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [appliedFilters]);

  const tableLeads = tableQuery.data?.data ?? [];
  const totalLeads = tableQuery.data?.pagination?.total ?? 0;
  const kanbanLeads = kanbanQuery.data?.data ?? [];
  const loading = view === 'table' ? tableQuery.isLoading : kanbanQuery.isLoading;

  const leadsByStatus = useMemo(
    () => groupLeadsByStatus(kanbanLeads, KANBAN_COLUMNS),
    [kanbanLeads]
  );

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  const refreshAfterAssign = useCallback(() => {
    invalidateLeads();
    setRowSelection({});
  }, [invalidateLeads]);

  const {
    assignees,
    assigneesLoading,
    assignModal,
    openAssign,
    openBulkAssign,
    closeAssign,
    handleAssign,
  } = useLeadAssign({ onAssigned: refreshAfterAssign });

  const selectedLeadIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const handleApply = () => setAppliedFilters({ ...filters });
  const handleReset = () => {
    const base = { ...emptyFilters, status: config.status || '' };
    setFilters(base);
    setAppliedFilters(base);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await API.delete(`/leads/${id}`);
    setPreviewLead(null);
    invalidateLeads();
  };

  const handleBulkDelete = async () => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (!window.confirm(`Delete ${ids.length} leads?`)) return;
    await Promise.all(ids.map((id) => API.delete(`/leads/${id}`)));
    setRowSelection({});
    invalidateLeads();
  };

  const handleDragStart = (event) => {
    const lead = kanbanLeads.find((l) => l._id === event.active.id);
    setActiveDragLead(lead);
  };

  const handleDragEnd = (event) => {
    setActiveDragLead(null);
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id;
    const validStatuses = KANBAN_COLUMNS.map((c) => c.value);
    let newStatus = over.id;

    if (!validStatuses.includes(newStatus)) {
      const overLead = kanbanLeads.find((l) => l._id === over.id);
      if (overLead) newStatus = normalizeLeadStatus(overLead.status);
      else return;
    }

    const lead = kanbanLeads.find((l) => l._id === leadId);
    if (!lead || normalizeLeadStatus(lead.status) === newStatus) return;

    queryClient.setQueryData(['leads', 'kanban', { filters: apiFilters }], (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l)),
      };
    });

    API.put(`/leads/${leadId}`, { status: newStatus }).catch(() => invalidateLeads());
  };

  const pageCount = Math.max(1, Math.ceil(totalLeads / pagination.pageSize) || 1);

  return (
    <div className="animate-fade-up">
      <LeadPageHeader
        title={config.title}
        total={view === 'table' ? totalLeads : kanbanLeads.length}
        view={view}
        onViewChange={setView}
      />

      <LeadFilterBar
        filters={filters}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
        activeCount={countActiveFilters(appliedFilters)}
      />

      <LeadBulkActionsBar
        count={selectedCount}
        onClear={() => setRowSelection({})}
        onAssign={isAdmin ? () => openBulkAssign(selectedLeadIds) : undefined}
        onStatusUpdate={() => toast.info('Bulk status update — jald aa raha hai')}
        onExport={() => toast.info('Export shuru ho raha hai…')}
        onDelete={handleBulkDelete}
      />

      {loading ? (
        <div className="rounded-2xl border border-subtle bg-surface p-16 text-center text-content-muted">
          Loading leads...
        </div>
      ) : view === 'table' ? (
        <LeadDataTable
          leads={tableLeads}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onRowClick={setPreviewLead}
          onDelete={handleDelete}
          onAssign={isAdmin ? openAssign : undefined}
          canEditLead={canEditLead}
          serverPagination={{
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount,
            total: totalLeads,
            onPaginationChange: setPagination,
          }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <LeadKanbanBoard
            columns={KANBAN_COLUMNS}
            leadsByStatus={leadsByStatus}
            onCardClick={setPreviewLead}
          />
          <DragOverlay>
            {activeDragLead ? (
              <div className="rounded-xl border border-brand-500/30 bg-surface p-3.5 shadow-xl w-[260px] rotate-1 opacity-95">
                <p className="text-sm font-semibold text-content-primary">{activeDragLead.name}</p>
                <p className="text-xs text-content-muted mt-1">{activeDragLead.destination}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <LeadPreviewDrawer
        lead={previewLead}
        onClose={() => setPreviewLead(null)}
        onAssign={isAdmin ? openAssign : undefined}
        canEditLead={canEditLead}
      />

      {isAdmin && (
        <AdminAssignLeadModal
          open={!!assignModal}
          lead={assignModal}
          assignees={assignees}
          loading={assigneesLoading}
          onClose={closeAssign}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}
