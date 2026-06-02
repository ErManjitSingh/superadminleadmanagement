import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import TablePagination, { DEFAULT_PAGE_SIZE } from '../ui/TablePagination';
import LeadStatusBadge from './LeadStatusBadge';
import { Button } from '../ui/button';

const STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'reactivated', label: 'Reactivated' },
  { value: 'reassigned', label: 'Reassigned' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up_scheduled', label: 'Follow Up Scheduled' },
  { value: 'quotation_sent', label: 'Quotation Sent' },
  { value: 'converted', label: 'Converted' },
];

function getPageConfig(pathname) {
  if (pathname.startsWith('/sales-manager')) {
    return {
      title: 'Reactivated Leads',
      breadcrumbs: ['Sales Manager', 'Reactivated Leads'],
      listUrl: '/sales-manager/leads',
      dashboardUrl: '/sales-manager/dashboard',
      getParams: (state) => ({
        filter: 'reactivated',
        search: state.search || undefined,
        page: state.page,
        limit: state.limit,
      }),
    };
  }

  if (pathname.startsWith('/team-leader')) {
    return {
      title: 'Reactivated Squad Leads',
      breadcrumbs: ['Team Leader', 'Reactivated Leads'],
      listUrl: '/team-leader/leads',
      dashboardUrl: '/team-leader/dashboard',
      getParams: (state) => ({
        filter: 'reactivated',
        search: state.search || undefined,
        page: state.page,
        limit: state.limit,
      }),
    };
  }

  return {
    title: 'Reactivated Leads',
    breadcrumbs: ['Admin', 'Reactivated Leads'],
    listUrl: '/leads',
    dashboardUrl: '/dashboard/stats',
    getParams: (state) => ({
      reactivatedOnly: true,
      reactivationStage: state.stage || undefined,
      search: state.search || undefined,
      page: state.page,
      limit: state.limit,
    }),
  };
}

export default function ReactivatedLeadsPage() {
  const location = useLocation();
  const config = useMemo(() => getPageConfig(location.pathname), [location.pathname]);

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [rows, setRows] = useState([]);
  const [widget, setWidget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE, total: 0 });

  const load = useCallback(() => {
    setLoading(true);
    const page = pagination.pageIndex + 1;
    const limit = pagination.pageSize;
    return Promise.all([
      API.get(config.listUrl, {
        params: config.getParams({ search, stage, page, limit }),
        skipSuccessToast: true,
      }),
      API.get(config.dashboardUrl, { skipSuccessToast: true }),
    ])
      .then(([listRes, dashboardRes]) => {
        const payload = listRes.data?.data ? listRes.data : { data: listRes.data, pagination: {} };
        setRows(payload.data || []);
        setPagination((prev) => ({
          ...prev,
          total: payload.pagination?.total ?? payload.data?.length ?? 0,
        }));
        setWidget(dashboardRes.data?.reactivationWidget || null);
      })
      .finally(() => setLoading(false));
  }, [config, pagination.pageIndex, pagination.pageSize, search, stage]);

  useEffect(() => {
    load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil((pagination.total || 0) / pagination.pageSize));

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description="Track each reactivated lead from recovery to conversion"
        breadcrumbs={config.breadcrumbs}
      />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          ['Reactivated', widget?.stageCounts?.reactivated || 0],
          ['Reassigned', widget?.stageCounts?.reassigned || 0],
          ['Contacted', widget?.stageCounts?.contacted || 0],
          ['Follow Up', widget?.stageCounts?.followUpScheduled || 0],
          ['Quotation', widget?.stageCounts?.quotationSent || 0],
          ['Converted', widget?.stageCounts?.converted || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-subtle bg-surface-elevated/60 p-3 text-center">
            <p className="text-[10px] uppercase text-content-muted">{label}</p>
            <p className="text-xl font-bold text-content-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            placeholder="Search customer, phone, destination"
            className="input-premium h-10 pl-10"
          />
        </div>
        <select
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="input-premium h-10 md:w-64"
        >
          {STAGES.map((s) => (
            <option key={s.value || 'all'} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={load} className="h-10">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-elevated/40">
                {['Lead', 'Phone', 'Executive', 'Stage', 'Status', 'Reactivated At', 'Updated'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] uppercase text-content-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-content-muted">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-content-muted">No reactivated leads found</td></tr>
              ) : rows.map((lead) => (
                <tr key={lead._id} className="hover:bg-surface-elevated/30">
                  <td className="px-4 py-3 font-semibold text-content-primary">{lead.name}</td>
                  <td className="px-4 py-3">{lead.phone || '—'}</td>
                  <td className="px-4 py-3">{lead.assignedTo?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 capitalize">{(lead.reactivation?.stage || 'reactivated').replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3"><LeadStatusBadge status={lead.status} size="sm" /></td>
                  <td className="px-4 py-3">{lead.reactivation?.reactivatedAt ? new Date(lead.reactivation.reactivatedAt).toLocaleString('en-IN') : '—'}</td>
                  <td className="px-4 py-3">{lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={pageCount}
          total={pagination.total}
          onPageChange={(pageIndex) => setPagination((p) => ({ ...p, pageIndex }))}
          onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize, total: pagination.total })}
        />
      </div>
    </div>
  );
}
