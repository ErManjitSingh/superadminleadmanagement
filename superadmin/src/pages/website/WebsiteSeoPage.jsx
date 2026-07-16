import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Select } from '../../components/ui/input';
import { SeoFields, seoFromForm, seoToForm } from '../../components/website/SeoFields';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteSeoPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['website-seo', q],
    queryFn: () => superAdminApi.listWebsiteSeo({ q: q || undefined, limit: 100 }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        pageKey: editing.pageKey,
        path: editing.path,
        title: editing.title,
        pageType: editing.pageType,
        googleIndexStatus: editing.googleIndexStatus,
        ...seoFromForm(editing),
      };
      return editing.id
        ? superAdminApi.updateWebsiteSeo(editing.id, payload)
        : superAdminApi.upsertWebsiteSeo(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-seo'] });
      setEditing(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => superAdminApi.syncWebsiteSeo(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-seo'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="SEO Management" description="Titles, meta, Open Graph, Twitter cards, schema, robots, and sitemap settings per page.">
        <Button variant="secondary" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
          <RefreshCw className="h-4 w-4" /> Sync from content
        </Button>
      </PageHeader>

      <Input className="max-w-xs" placeholder="Search pages…" value={q} onChange={(e) => setQ(e.target.value)} />

      {editing && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Page Key</Label><Input value={editing.pageKey || ''} onChange={(e) => setEditing({ ...editing, pageKey: e.target.value })} disabled={!!editing.id} /></div>
            <div><Label>Path</Label><Input value={editing.path || ''} onChange={(e) => setEditing({ ...editing, path: e.target.value })} /></div>
            <div><Label>Title</Label><Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div>
              <Label>Google Index Status</Label>
              <Select value={editing.googleIndexStatus || 'unknown'} onChange={(e) => setEditing({ ...editing, googleIndexStatus: e.target.value })}>
                {['unknown', 'indexed', 'not_indexed', 'excluded', 'error'].map((v) => <option key={v} value={v}>{v}</option>)}
              </Select>
            </div>
          </div>
          <SeoFields form={editing} setForm={setEditing} />
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()}>Save SEO</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? <div className="py-12 text-center">Loading…</div> : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{item.title || item.pageKey}</h3>
                  <StatusBadge status={item.googleIndexStatus} />
                </div>
                <p className="text-xs text-[var(--text-muted)]">{item.path} · {item.pageType}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.seoTitle || 'No SEO title'}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing({ ...seoToForm(item), ...item })}>Edit SEO</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
