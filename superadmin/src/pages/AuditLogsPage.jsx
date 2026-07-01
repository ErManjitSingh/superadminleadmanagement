import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '../api/superadmin';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Input, Select } from '../components/ui/input';
import { formatDate } from '../lib/utils';

export default function AuditLogsPage() {
  const [tab, setTab] = useState('audit');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-logs', { search, page }],
    queryFn: () => superAdminApi.getAuditLogs({ search, page, limit: 25 }).then((r) => r.data),
    enabled: tab === 'audit',
  });

  const { data: loginData, isLoading: loginLoading } = useQuery({
    queryKey: ['login-logs', { page }],
    queryFn: () => superAdminApi.getLoginLogs({ page, limit: 25 }).then((r) => r.data),
    enabled: tab === 'login',
  });

  const rows = tab === 'audit' ? auditData?.data || [] : loginData?.data || [];
  const pagination = tab === 'audit' ? auditData?.pagination : loginData?.pagination;
  const loading = tab === 'audit' ? auditLoading : loginLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-[var(--text-secondary)]">Platform audit and company login activity</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={tab} onChange={(e) => { setTab(e.target.value); setPage(1); }} className="w-44">
          <option value="audit">Audit Logs</option>
          <option value="login">Login Logs</option>
        </Select>
        {tab === 'audit' && (
          <Input
            className="max-w-xs"
            placeholder="Search actor or action…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        )}
      </div>

      <Card>
        <CardHeader><CardTitle>{tab === 'audit' ? 'Platform Audit Logs' : 'Company Login Logs'}</CardTitle></CardHeader>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-900/50">
              <tr>
                {tab === 'audit' ? (
                  <>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Resource</th>
                    <th className="px-4 py-3 text-left">Actor</th>
                    <th className="px-4 py-3 text-left">When</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left">Company</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">When</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">No logs</td></tr>
              ) : tab === 'audit' ? (
                rows.map((log) => (
                  <tr key={log._id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium">{log.action}</td>
                    <td className="px-4 py-3">{log.resourceType}</td>
                    <td className="px-4 py-3">{log.actorEmail || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              ) : (
                rows.map((log) => (
                  <tr key={log._id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">{log.companyId?.name || '—'}</td>
                    <td className="px-4 py-3">{log.userEmail}</td>
                    <td className="px-4 py-3 capitalize">{log.loginType}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between text-sm text-[var(--text-muted)]">
          <span>Page {pagination?.page || 1} of {pagination?.totalPages || 1}</span>
          <div className="flex gap-2">
            <button type="button" className="underline disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <button type="button" className="underline disabled:opacity-40" disabled={page >= (pagination?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
