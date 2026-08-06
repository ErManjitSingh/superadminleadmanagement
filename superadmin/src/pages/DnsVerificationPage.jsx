import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader, EmptyState } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatDate } from '../lib/utils';

export default function DnsVerificationPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['dns-pending'],
    queryFn: () => superAdminApi.listPendingDns().then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => superAdminApi.verifyDomain(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['dns-pending'] });
      if (!res?.data?.verified) {
        window.alert(res?.data?.message || 'DNS not detected yet. Check CNAME/A records and try again.');
      }
    },
    onError: (err) => {
      window.alert(err?.response?.data?.message || err?.message || 'Verification failed');
    },
  });

  const rows = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="DNS Verification" description="Custom domains awaiting CNAME or A record verification." />
      {isLoading ? <p>Loading…</p> : rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="All clear" description="No pending DNS verifications." />
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">{r.companyName}</p>
                <p className="text-sm text-[var(--text-muted)]">{r.primaryDomain}</p>
                <p className="text-xs text-[var(--text-muted)]">Created {formatDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => verifyMutation.mutate(r.companyId || r.id)}
                  disabled={verifyMutation.isPending}
                >
                  Verify DNS
                </Button>
                <Link to={`/admin/companies/${r.companyId || r.id}`}><Button variant="outline">Company</Button></Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
