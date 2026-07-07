import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Filter,
  IndianRupee,
  KeyRound,
  LogIn,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input, Select } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { SslStatusBadge } from '../components/domains/DomainStatusBadge';
import PlanBadge from '../components/companies/PlanBadge';
import MetricSparkCard from '../components/dashboard/MetricSparkCard';
import { cn, formatCurrency, formatDate, STATUS_COLORS } from '../lib/utils';
import { PLATFORM_DOMAIN } from '../lib/branding';

const AVATAR_COLORS = [
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
];

function avatarColor(name = '') {
  const code = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function pctOf(part, total) {
  if (!total) return '0%';
  return `${((part / total) * 100).toFixed(1)}% of total`;
}

function daysUntil(date) {
  if (!date) return null;
  return Math.max(0, Math.ceil((new Date(date) - Date.now()) / 86400000));
}

function dateRangeLabel() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(start)} - ${fmt(end)}`;
}

function ActionsMenu({ company, onAction }) {
  const [open, setOpen] = useState(false);
  const items = [
    { label: 'View', icon: Eye, action: 'view' },
    { label: 'Suspend', icon: Pause, action: 'suspend', hide: company.status === 'suspended' },
    { label: 'Activate', icon: Play, action: 'activate', hide: company.status === 'active' },
    { label: 'Login As Admin', icon: LogIn, action: 'impersonate' },
    { label: 'Reset Password', icon: KeyRound, action: 'reset' },
    { label: 'Delete', icon: Trash2, action: 'delete', danger: true, hide: company.isLegacy },
  ].filter((i) => !i.hide);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {items.map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => { setOpen(false); onAction(item.action, company); }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800', item.danger && 'text-red-600')}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const limit = 10;

  const { data: dash } = useQuery({
    queryKey: ['dashboard-companies-kpi'],
    queryFn: () => superAdminApi.getDashboard().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => superAdminApi.listPlans().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, status, plan, domainFilter, page }],
    queryFn: () => superAdminApi.listCompanies({ search, status, plan, domainFilter, page, limit }).then((r) => r.data),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload) => superAdminApi.bulkCompanies(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setSelected([]); },
  });

  const companies = data?.data || [];
  const pagination = data?.pagination || {};
  const m = dash?.metrics || {};
  const spark = (dash?.registrationTrend || []).slice(-7).map((r) => r.count || 0);
  const total = m.totalCompanies || pagination.total || 0;

  function companyId(company) {
    return company?.id || company?._id;
  }

  async function handleAction(action, company) {
    const id = companyId(company);
    if (action === 'view' && id) { navigate(`/admin/companies/${id}`); return; }
    if (action === 'suspend') await superAdminApi.bulkCompanies({ ids: [id], action: 'suspend' });
    if (action === 'activate') await superAdminApi.bulkCompanies({ ids: [id], action: 'activate' });
    if (action === 'delete' && confirm('Delete this company?')) await superAdminApi.deleteCompany(id);
    if (action === 'reset') {
      const res = await superAdminApi.resetPassword(id);
      alert(`Temp password: ${res.data.tempPassword}`);
    }
    if (action === 'impersonate') {
      const res = await superAdminApi.impersonate(id);
      const { token, user, redirectUrl } = res.data;
      const params = new URLSearchParams({ token, user: JSON.stringify(user), impersonation: 'true', companyName: res.data.company?.name || company.name });
      window.open(`${redirectUrl}?${params}`, '_blank');
    }
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  }

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => <input type="checkbox" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" checked={row.getIsSelected()} disabled={row.original.isLegacy} onChange={row.getToggleSelectedHandler()} />,
    },
    {
      header: 'Company',
      cell: ({ row }) => {
        const c = row.original;
        const domain = c.primaryDomain || c.customDomain || `${c.subdomain}.${PLATFORM_DOMAIN}`;
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white', avatarColor(c.name))}>
              {c.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <Link to={`/admin/companies/${companyId(c)}`} className="font-semibold text-slate-900 hover:text-violet-600 dark:text-white">
                {c.name}
              </Link>
              <p className="text-xs text-slate-500">{domain}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Owner',
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="text-sm font-medium">{row.original.ownerName}</p>
          <p className="text-xs text-slate-500">{row.original.ownerEmail}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      cell: ({ row }) => <PlanBadge plan={row.original.subscriptionPlan} />,
    },
    {
      header: 'Domains',
      cell: ({ row }) => {
        const domain = row.original.primaryDomain || row.original.customDomain;
        if (!domain) return <span className="text-slate-400">—</span>;
        return (
          <div className="flex items-center gap-1.5 text-sm">
            {row.original.domainVerified && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{domain}</span>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: ({ row }) => <Badge className={cn('capitalize', STATUS_COLORS[row.original.status])}>{row.original.status}</Badge>,
    },
    {
      header: 'SSL',
      cell: ({ row }) => <SslStatusBadge status={row.original.sslStatus} />,
    },
    {
      header: 'Users',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {row.original.usersCount ?? 0}
        </span>
      ),
    },
    {
      header: 'Revenue',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {formatCurrency(row.original.subscriptionPlan?.monthlyPrice || 0)}
        </span>
      ),
    },
    {
      header: 'Renewal',
      cell: ({ row }) => {
        const date = row.original.renewDate || row.original.trialEndDate;
        const days = daysUntil(date);
        return (
          <div>
            <p className="text-sm">{date ? formatDate(date) : '—'}</p>
            {days != null && (
              <p className={cn('text-xs font-medium', days <= 14 ? 'text-amber-600' : 'text-emerald-600')}>
                {days} days
              </p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Created',
      cell: ({ row }) => <span className="text-sm text-slate-600">{formatDate(row.original.createdAt)}</span>,
    },
    { id: 'actions', header: '', cell: ({ row }) => <ActionsMenu company={row.original} onAction={handleAction} /> },
  ], [navigate]);

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(Object.fromEntries(selected.map((id) => [id, true]))) : updater;
      setSelected(Object.keys(next).filter((k) => next[k]).map((idx) => companies[Number(idx)]?.id).filter(Boolean));
    },
    getRowId: (_, index) => String(index),
  });

  const totalPages = pagination.totalPages || 1;
  const pageStart = total ? (page - 1) * limit + 1 : 0;
  const pageEnd = Math.min(page * limit, pagination.total || 0);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const max = Math.min(totalPages, 5);
    let start = Math.max(1, page - 2);
    if (start + max - 1 > totalPages) start = Math.max(1, totalPages - max + 1);
    for (let i = 0; i < max; i += 1) pages.push(start + i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">Manage all tenant companies and their workspaces.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => superAdminApi.exportCompanies({ search, status }).then((r) => {
              const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'companies.json';
              a.click();
            })}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link to="/admin/companies/new">
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-500">
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricSparkCard title="Total Companies" value={total} change={`${m.newCompaniesThisMonth || 0} this month`} trendUp icon={Building2} iconBg="bg-violet-500/15 text-violet-600" sparkData={spark} sparkColor="#8b5cf6" />
        <MetricSparkCard title="Active Companies" value={m.activeCompanies || 0} change={pctOf(m.activeCompanies, total)} trendUp icon={Users} iconBg="bg-emerald-500/15 text-emerald-600" sparkData={spark} sparkColor="#10b981" />
        <MetricSparkCard title="Trial Companies" value={m.trialCompanies || 0} change={pctOf(m.trialCompanies, total)} trendUp={false} icon={Clock} iconBg="bg-amber-500/15 text-amber-600" sparkData={spark} sparkColor="#f59e0b" />
        <MetricSparkCard title="Expired Companies" value={m.expiredCompanies || 0} change={pctOf(m.expiredCompanies, total)} trendUp={false} icon={Building2} iconBg="bg-rose-500/15 text-rose-600" sparkData={spark} sparkColor="#f43f5e" />
        <MetricSparkCard title="Monthly Revenue" value={formatCurrency(m.monthlyRevenue)} change={`${m.newCompaniesThisMonth || 0} new`} trendUp icon={IndianRupee} iconBg="bg-sky-500/15 text-sky-600" sparkData={spark} sparkColor="#0ea5e9" />
        <MetricSparkCard title="Today's Signups" value={m.newCompaniesToday || 0} change="new today" trendUp icon={IndianRupee} iconBg="bg-indigo-500/15 text-indigo-600" sparkData={spark} sparkColor="#6366f1" />
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="rounded-xl border-slate-200 bg-slate-50 pl-9 dark:bg-slate-900"
                placeholder="Search by company name, owner, domain..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-36 rounded-xl">
              <option value="">All Statuses</option>
              {['active', 'trial', 'suspended', 'expired', 'inactive'].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="w-36 rounded-xl">
              <option value="">All Plans</option>
              {(plansData || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }} className="w-40 rounded-xl">
              <option value="">All Domains</option>
              <option value="verified">Verified domains</option>
              <option value="pending_dns">Pending DNS</option>
              <option value="ssl_failed">SSL failed</option>
              <option value="custom_connected">Custom connected</option>
              <option value="no_custom">No custom domain</option>
            </Select>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900">
              <Calendar className="h-3.5 w-3.5" />
              {dateRangeLabel()}
            </button>
            {selected.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => bulkMutation.mutate({ ids: selected, action: 'activate' })}>Activate</Button>
                <Button size="sm" variant="outline" onClick={() => bulkMutation.mutate({ ids: selected, action: 'suspend' })}>Suspend</Button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-900/60">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3.5 whitespace-nowrap">{flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-slate-500">Loading companies…</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-slate-500">No companies found</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3.5 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-800">
          <span>
            Showing {pageStart} to {pageEnd} of {pagination.total || 0} companies
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="rounded-lg" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Back</Button>
            {pageNumbers.map((n) => (
              <Button
                key={n}
                variant={n === page ? 'default' : 'outline'}
                size="sm"
                className={cn('min-w-9 rounded-lg', n === page && 'bg-violet-600 hover:bg-violet-500')}
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            {totalPages > 5 && page < totalPages - 2 && <span className="px-1">…</span>}
            {totalPages > 5 && <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setPage(totalPages)}>{totalPages}</Button>}
            <Button variant="outline" size="sm" className="rounded-lg" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
