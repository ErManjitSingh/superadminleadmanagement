import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Download, Eye, Plus, Search } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input, Select } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn, formatDate, STATUS_COLORS } from '../lib/utils';
import { PLATFORM_DOMAIN } from '../lib/branding';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, status, page }],
    queryFn: () =>
      superAdminApi
        .listCompanies({ search, status, page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' })
        .then((r) => r.data),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload) => superAdminApi.bulkCompanies(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setSelected([]);
    },
  });

  const companies = data?.data || [];
  const pagination = data?.pagination || {};

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={row.original.isLegacy}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: 'Company',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{row.original.subdomain}.{PLATFORM_DOMAIN}</p>
          </div>
        ),
      },
      { accessorKey: 'ownerEmail', header: 'Owner' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge className={STATUS_COLORS[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      {
        header: 'Plan',
        cell: ({ row }) => row.original.subscriptionPlan?.name || '—',
      },
      {
        header: 'Users',
        cell: ({ row }) => row.original.usersCount,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link to={`/admin/companies/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(Object.fromEntries(selected.map((id) => [id, true]))) : updater;
      setSelected(Object.keys(next).filter((k) => next[k]).map((idx) => companies[Number(idx)]?.id).filter(Boolean));
    },
    getRowId: (row, index) => String(index),
  });

  async function handleExport() {
    const res = await superAdminApi.exportCompanies({ search, status });
    const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies-export.json';
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-[var(--text-secondary)]">Manage tenant organizations on the platform</p>
        </div>
        <Link to="/admin/companies/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              className="pl-9"
              placeholder="Search companies…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </Select>
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {selected.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-brand-500/10 px-3 py-2">
            <span className="text-sm">{selected.length} selected</span>
            <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate({ ids: selected, action: 'activate' })}>Activate</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate({ ids: selected, action: 'suspend' })}>Suspend</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate({ ids: selected, action: 'extend_trial', trialDays: 14 })}>Extend Trial</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkMutation.mutate({ ids: selected, action: 'renew' })}>Renew</Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">Loading…</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">No companies found</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)] hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Page {pagination.page} of {pagination.totalPages || 1} · {pagination.total} total
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
