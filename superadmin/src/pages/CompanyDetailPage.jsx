import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Calendar, HardDrive, LogIn, Mail, MapPin, Shield, Users,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PLATFORM_DOMAIN } from '../lib/branding';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import DomainManagementPanel from '../components/domains/DomainManagementPanel';
import { formatDate, formatCurrency, STATUS_COLORS } from '../lib/utils';

const TABS = ['Overview', 'Subscription', 'Domain Management', 'Users', 'Storage', 'Billing', 'Security', 'Activity', 'Settings'];

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [impersonating, setImpersonating] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['company', id],
    queryFn: () => superAdminApi.getCompany(id).then((r) => r.data),
    enabled: Boolean(id),
  });

  const { data: usersData } = useQuery({
    queryKey: ['company-users', id],
    queryFn: () => superAdminApi.getCompanyUsers(id).then((r) => r.data),
    enabled: tab === 'Users',
  });

  const deleteMutation = useMutation({
    mutationFn: () => superAdminApi.deleteCompany(id),
    onSuccess: () => navigate('/admin/companies'),
  });

  const company = data?.company;
  const plan = company?.subscriptionPlan;

  async function handleImpersonate() {
    setImpersonating(true);
    try {
      const res = await superAdminApi.impersonate(id);
      const { token, user, redirectUrl } = res.data;
      const params = new URLSearchParams({
        token,
        user: JSON.stringify(user),
        impersonation: 'true',
        companyName: res.data.company?.name || company.name,
      });
      window.open(`${redirectUrl}?${params}`, '_blank');
    } finally {
      setImpersonating(false);
    }
  }

  if (isLoading) return <div className="py-20 text-center text-[var(--text-muted)]">Loading…</div>;
  if (isError) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">Could not load company</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{error?.response?.data?.message || error?.message || 'Unknown error'}</p>
        <Link to="/admin/companies" className="mt-4 inline-block text-violet-600 hover:underline">Back to companies</Link>
      </div>
    );
  }
  if (!company) return (
    <div className="py-20 text-center">
      <p className="text-lg font-semibold">Company not found</p>
      <Link to="/admin/companies" className="mt-4 inline-block text-violet-600 hover:underline">Back to companies</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/companies"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white">
            {company.logo ? <img src={company.logo} alt="" className="h-full w-full rounded-2xl object-cover" /> : (company.name?.[0] || '?')}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <Badge className={STATUS_COLORS[company.status]}>{company.status}</Badge>
            </div>
            <p className="text-sm text-[var(--text-muted)]">{company.subdomain}.{PLATFORM_DOMAIN}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleImpersonate} disabled={impersonating}><LogIn className="h-4 w-4" />Login As Company Admin</Button>
          {!company.isLegacy && <Button variant="outline" onClick={() => deleteMutation.mutate()}>Delete</Button>}
        </div>
      </div>

      <Card className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs text-[var(--text-muted)]">Owner</p><p className="font-medium">{company.ownerName}</p></div>
        <div><p className="text-xs text-[var(--text-muted)]">Plan</p><p className="font-medium">{plan?.name || '—'}</p></div>
        <div><p className="text-xs text-[var(--text-muted)]">Users</p><p className="font-medium">{company.usersCount}</p></div>
        <div><p className="text-xs text-[var(--text-muted)]">Storage</p><p className="font-medium">{((company.storageUsedMb || 0) / 1024).toFixed(1)} / {company.storageLimitGb || 0} GB</p></div>
      </Card>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${tab === t ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-900' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5 space-y-3">
            <CardHeader className="p-0"><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company Profile</CardTitle></CardHeader>
            <InfoRow icon={Mail} label="Email" value={company.ownerEmail} />
            <InfoRow icon={MapPin} label="Address" value={[company.address, company.city, company.state, company.country].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={Calendar} label="Created" value={formatDate(company.createdAt)} />
            <InfoRow icon={Shield} label="GST" value={company.gst || '—'} />
            <InfoRow label="Last Login" value={data?.adminUser?.lastLogin ? formatDate(data.adminUser.lastLogin) : '—'} />
          </Card>
          <Card className="p-5">
            <CardTitle className="mb-3">Features</CardTitle>
            <div className="flex flex-wrap gap-2">
              {Object.entries(company.features || {}).filter(([, v]) => v).map(([k]) => <Badge key={k} className="capitalize">{k}</Badge>)}
            </div>
          </Card>
        </div>
      )}

      {tab === 'Subscription' && (
        <Card className="p-5 space-y-3">
          <p><span className="text-[var(--text-muted)]">Plan:</span> <strong>{plan?.name}</strong></p>
          <p><span className="text-[var(--text-muted)]">Monthly:</span> {formatCurrency(plan?.monthlyPrice)}</p>
          <p><span className="text-[var(--text-muted)]">Trial ends:</span> {formatDate(company.trialEndDate)}</p>
          <p><span className="text-[var(--text-muted)]">Renewal:</span> {formatDate(company.renewDate)}</p>
        </Card>
      )}

      {tab === 'Domain Management' && (
        <DomainManagementPanel company={company} onUpdated={() => refetch()} />
      )}

      {tab === 'Users' && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-left text-xs uppercase dark:bg-slate-900/50"><tr>{['Name', 'Email', 'Role', 'Status', 'Last Login'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>
              {(usersData?.data || []).map((u) => (
                <tr key={u.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{u.name}</td><td className="px-4 py-3">{u.email}</td><td className="px-4 py-3 capitalize">{u.role}</td><td className="px-4 py-3">{u.status}</td><td className="px-4 py-3">{u.lastLogin ? formatDate(u.lastLogin) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-muted)]">User metadata only — no leads, bookings or CRM records.</p>
        </Card>
      )}

      {tab === 'Storage' && (
        <Card className="p-5"><HardDrive className="mb-2 h-6 w-6 text-violet-500" /><p className="text-2xl font-bold">{(company.storageUsedMb / 1024).toFixed(2)} GB used</p><p className="text-[var(--text-muted)]">Limit: {company.storageLimitGb} GB</p></Card>
      )}

      {tab === 'Billing' && <Card className="p-5 text-sm text-[var(--text-secondary)]">Generate invoices from the <Link to="/admin/invoices" className="text-violet-600 hover:underline">Invoices</Link> page.</Card>}

      {tab === 'Security' && (
        <Card className="space-y-3 p-5">
          <Button variant="outline" onClick={async () => { const r = await superAdminApi.resetPassword(id); alert(`Temp password: ${r.data.tempPassword}`); }}>Reset Admin Password</Button>
          <p className="text-xs text-[var(--text-muted)]">Password resets are logged in audit logs.</p>
        </Card>
      )}

      {tab === 'Activity' && (
        <div className="space-y-4">
          {(data?.auditLogs || []).map((log) => (
            <Card key={log._id} className="p-3 text-sm"><span className="font-medium">{log.action}</span> · {formatDate(log.createdAt)}</Card>
          ))}
        </div>
      )}

      {tab === 'Settings' && (
        <Card className="p-5 text-sm">
          <p>Timezone: {company.timezone}</p>
          <p>Currency: {company.currency}</p>
          <p className="mt-2 text-[var(--text-muted)]">Tenant SMTP/WhatsApp settings are managed inside the company CRM.</p>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {Icon && <Icon className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />}
      <span className="text-[var(--text-muted)]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
