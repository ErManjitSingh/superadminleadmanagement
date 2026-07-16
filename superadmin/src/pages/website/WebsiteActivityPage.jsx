import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Input, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function WebsiteActivityPage() {
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [q, setQ] = useState('');

  const params = useMemo(() => ({
    action: action || undefined,
    resourceType: resourceType || undefined,
    q: q || undefined,
    limit: 100,
  }), [action, resourceType, q]);

  const { data, isLoading } = useQuery({
    queryKey: ['website-activity', params],
    queryFn: () => superAdminApi.listWebsiteActivity(params).then((r) => r.data),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="Track creates, updates, deletes, publishes, uploads, and exports across the website module." />

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-40" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {['created', 'updated', 'deleted', 'published', 'archived', 'duplicated', 'exported', 'uploaded', 'sorted'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </Select>
        <Select className="w-44" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
          <option value="">All resources</option>
          {['trek', 'destination', 'blog', 'media', 'lead', 'settings', 'menu', 'seo_page', 'homepage_section'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </Select>
      </div>

      {isLoading ? <div className="py-12 text-center">Loading activity…</div> : (
        <div className="grid gap-2">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={item.action} />
                  <span className="text-sm font-medium">{item.title || item.resourceType}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {item.actorName || item.actorEmail || 'System'} · {item.resourceType} · {formatDate(item.createdAt)}
                </p>
              </div>
              {item.ipAddress && <span className="text-[10px] text-[var(--text-muted)]">{item.ipAddress}</span>}
            </Card>
          ))}
          {!items.length && <p className="text-sm text-[var(--text-muted)]">No activity yet.</p>}
        </div>
      )}
    </div>
  );
}
