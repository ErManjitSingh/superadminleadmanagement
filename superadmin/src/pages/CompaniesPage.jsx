import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Download, Eye, KeyRound, LogIn, Mail, MoreHorizontal, Pause, Play, Plus, Search, Trash2,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input, Select } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { DnsStatusBadge, SslStatusBadge } from '../components/domains/DomainStatusBadge';
import { cn, formatDate, STATUS_COLORS } from '../lib/utils';
import { PLATFORM_DOMAIN } from '../lib/branding';

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
          <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-[var(--border)] bg-white py-1 shadow-xl dark:bg-slate-900">
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, status, domainFilter, page }],
    queryFn: () => superAdminApi.listCompanies({ search, status, domainFilter, page, limit: 15 }).then((r) => r.data),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload) => superAdminApi.bulkCompanies(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setSelected([]); },
  });

  const companies = data?.data || [];
  const pagination = data?.pagination || {};

  async function handleAction(action, company) {
    if (action === 'view') window.location.href = `/admin/companies/${company.id}`;
    if (action === 'suspend') await superAdminApi.bulkCompanies({ ids: [company.id], action: 'suspend' });
    if (action === 'activate') await superAdminApi.bulkCompanies({ ids: [company.id], action: 'activate' });
    if (action === 'delete' && confirm('Delete this company?')) await superAdminApi.deleteCompany(company.id);
    if (action === 'reset') {
      const res = await superAdminApi.resetPassword(company.id);
      alert(`Temp password: ${res.data.tempPassword}`);
    }
    if (action === 'impersonate') {
      const res = await superAdminApi.impersonate(company.id);
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
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
            {row.original.name?.[0]}
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.original.subdomain}.{PLATFORM_DOMAIN}</p>
          </div>
        </div>
      ),
    },
    { header: 'Owner', cell: ({ row }) => <div><p className="text-sm">{row.original.ownerName}</p><p className="text-xs text-[var(--text-muted)]">{row.original.ownerEmail}</p></div> },
    { header: 'Phone', cell: ({ row }) => row.original.phone || '—' },
    { header: 'Plan', cell: ({ row }) => row.original.subscriptionPlan?.name || '—' },
    {
      header: 'System Domain',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.systemDomain || `${row.original.subdomain}.${PLATFORM_DOMAIN}`}</span>
      ),
    },
    {
      header: 'Custom Domain',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.customDomain || row.original.primaryDomain || '—'}</span>
      ),
    },
    {
      header: 'DNS',
      cell: ({ row }) => (
        <DnsStatusBadge status={row.original.domainStatus || (row.original.domainVerified ? 'verified' : row.original.primaryDomain ? 'pending' : 'not_connected')} />
      ),
    },
    {
      header: 'SSL',
      cell: ({ row }) => <SslStatusBadge status={row.original.sslStatus} />,
    },
    { header: 'Status', cell: ({ row }) => <Badge className={STATUS_COLORS[row.original.status]}>{row.original.status}</Badge> },
    { header: 'Trial Ends', cell: ({ row }) => row.original.trialEndDate ? formatDate(row.original.trialEndDate) : '—' },
    { header: 'Renewal', cell: ({ row }) => row.original.renewDate ? formatDate(row.original.renewDate) : '—' },
    { header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: 'actions', header: '', cell: ({ row }) => <ActionsMenu company={row.original} onAction={handleAction} /> },
  ], [queryClient]);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="Manage tenant workspaces — no CRM business data is displayed.">
        <Link to="/admin/companies/new"><Button><Plus className="h-4 w-4" />Create Company</Button></Link>
        <Button variant="outline" onClick={() => superAdminApi.exportCompanies({ search, status }).then((r) => {
          const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'companies.json'; a.click();
        })}><Download className="h-4 w-4" />Export</Button>
      </PageHeader>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input className="pl-9" placeholder="Search companies…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
            <option value="">All statuses</option>
            {['active', 'trial', 'suspended', 'expired', 'inactive'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={domainFilter} onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }} className="w-52">
            <option value="">All domains</option>
            <option value="verified">Verified domains</option>
            <option value="pending_dns">Pending DNS</option>
            <option value="ssl_failed">SSL failed</option>
            <option value="custom_connected">Custom domain connected</option>
            <option value="no_custom">No custom domain</option>
          </Select>
          {selected.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkMutation.mutate({ ids: selected, action: 'activate' })}>Activate</Button>
              <Button size="sm" variant="outline" onClick={() => bulkMutation.mutate({ ids: selected, action: 'suspend' })}>Suspend</Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[1400px] text-sm">
            <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-wide text-[var(--text-muted)] dark:bg-slate-900/50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-4 py-3 font-semibold">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--text-muted)]">Loading…</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-[var(--text-muted)]">No companies found</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] hover:bg-slate-50/50 dark:hover:bg-white/5">
                    {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>Page {pagination.page || page} of {pagination.totalPages || 1} · {pagination.total || 0} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
