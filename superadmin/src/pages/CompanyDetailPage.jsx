import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Calendar,
  HardDrive,
  LogIn,
  Mail,
  MapPin,
  Users,
} from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatDate, formatCurrency, STATUS_COLORS } from '../lib/utils';

const CRM_URL = import.meta.env.VITE_CRM_URL || 'http://localhost:5173';

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [impersonating, setImpersonating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: () => superAdminApi.getCompany(id).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: () => superAdminApi.deleteCompany(id),
    onSuccess: () => navigate('/admin/companies'),
  });

  const company = data?.company;

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
      window.open(`${redirectUrl}?${params.toString()}`, '_blank');
    } finally {
      setImpersonating(false);
    }
  }

  if (isLoading) {
    return <div className="py-20 text-center text-[var(--text-muted)]">Loading company…</div>;
  }

  if (!company) {
    return <div className="py-20 text-center">Company not found</div>;
  }

  const plan = company.subscriptionPlan;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/companies">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{company.name}</h1>
              <Badge className={STATUS_COLORS[company.status]}>{company.status}</Badge>
              {company.isLegacy && <Badge className="bg-violet-500/15 text-violet-700">Legacy Tenant</Badge>}
            </div>
            <p className="text-[var(--text-secondary)]">{company.subdomain}.unotrips.com</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleImpersonate} disabled={impersonating || !company.adminUserId}>
            <LogIn className="h-4 w-4" />
            Login as Company
          </Button>
          {!company.isLegacy && (
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm('Soft-delete this company?')) deleteMutation.mutate();
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Company Information</CardTitle>
            </CardHeader>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div><dt className="text-xs text-[var(--text-muted)]">Slug</dt><dd className="font-medium">{company.slug}</dd></div>
              <div><dt className="text-xs text-[var(--text-muted)]">Primary Domain</dt><dd className="font-medium">{company.primaryDomain || '—'}</dd></div>
              <div><dt className="text-xs text-[var(--text-muted)]">GST</dt><dd className="font-medium">{company.gst || '—'}</dd></div>
              <div><dt className="text-xs text-[var(--text-muted)]">Timezone</dt><dd className="font-medium">{company.timezone}</dd></div>
              <div><dt className="text-xs text-[var(--text-muted)]">Currency</dt><dd className="font-medium">{company.currency}</dd></div>
              <div className="sm:col-span-2 flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />
                <div>
                  <dt className="text-xs text-[var(--text-muted)]">Address</dt>
                  <dd>{[company.address, company.city, company.state, company.country].filter(Boolean).join(', ') || '—'}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Owner</CardTitle>
            </CardHeader>
            <p className="font-medium">{company.ownerName}</p>
            <p className="text-[var(--text-secondary)]">{company.ownerEmail}</p>
            {company.phone && <p className="mt-1 text-sm">{company.phone}</p>}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enabled Features</CardTitle>
              <CardDescription>Platform feature flags — not CRM data</CardDescription>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {Object.entries(company.features || {})
                .filter(([, enabled]) => enabled)
                .map(([key]) => (
                  <Badge key={key} className="bg-brand-500/15 text-brand-700 dark:text-brand-300">{key}</Badge>
                ))}
            </div>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Subscription</CardTitle></CardHeader>
            <p className="text-lg font-semibold">{plan?.name || '—'}</p>
            {plan && (
              <p className="text-sm text-[var(--text-secondary)]">
                {formatCurrency(plan.monthlyPrice)}/mo · {formatCurrency(plan.yearlyPrice)}/yr
              </p>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Trial ends: {formatDate(company.trialEndDate)}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Renews: {formatDate(company.renewDate)}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Created: {formatDate(company.createdAt)}</div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><Users className="h-4 w-4" /> Users</span>
                <span className="font-semibold">{company.usersCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm"><HardDrive className="h-4 w-4" /> Storage</span>
                <span className="font-semibold">{(company.storageUsedMb / 1024).toFixed(1)} / {company.storageLimitGb} GB</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Login History</CardTitle></CardHeader>
            <div className="max-h-48 space-y-2 overflow-auto text-sm">
              {(data?.loginLogs || []).map((log) => (
                <div key={log._id} className="rounded-lg border border-[var(--border)] px-2 py-1.5">
                  <p>{log.userEmail} {log.loginType === 'impersonation' && <Badge className="ml-1 bg-amber-500/15 text-amber-700">impersonation</Badge>}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(log.createdAt)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
