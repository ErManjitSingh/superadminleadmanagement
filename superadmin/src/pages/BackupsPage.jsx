import { useQuery } from '@tanstack/react-query';
import { Archive } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatDate } from '../lib/utils';

export default function BackupsPage() {
  const { data } = useQuery({ queryKey: ['backups'], queryFn: () => superAdminApi.getBackups().then((r) => r.data) });

  return (
    <div className="space-y-6">
      <PageHeader title="Backups" description="Database backup monitoring and schedules." />
      <div className="grid gap-4">
        {(data?.data || []).map((b) => (
          <Card key={b.id} className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3"><Archive className="h-5 w-5 text-violet-500" /><div><p className="font-semibold">{b.name}</p><p className="text-sm text-[var(--text-muted)]">Schedule: {b.schedule} · {b.sizeGb} GB</p></div></div>
            <div className="text-right"><Badge className="bg-emerald-500/15 text-emerald-700">{b.status}</Badge><p className="mt-1 text-xs text-[var(--text-muted)]">Last: {formatDate(b.lastRun)}</p></div>
          </Card>
        ))}
      </div>
      <p className="text-sm text-[var(--text-muted)]">{data?.message}</p>
    </div>
  );
}
