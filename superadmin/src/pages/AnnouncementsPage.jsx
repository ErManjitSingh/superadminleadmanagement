import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label, Textarea } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { formatDate } from '../lib/utils';

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetType: 'all', channels: ['dashboard_banner'], status: 'draft' });

  const { data } = useQuery({ queryKey: ['announcements'], queryFn: () => superAdminApi.listAnnouncements().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => superAdminApi.createAnnouncement(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); setShowForm(false); setForm({ title: '', body: '', targetType: 'all', channels: ['dashboard_banner'], status: 'draft' }); },
  });

  const publishMutation = useMutation({
    mutationFn: (id) => superAdminApi.updateAnnouncement(id, { status: 'published' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Broadcast to all companies, selected tenants, or by plan.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" />New Announcement</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Message</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Target</Label><select className="flex h-10 w-full rounded-lg border px-3" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })}><option value="all">All Companies</option><option value="plan">Plan Wise</option><option value="selected">Selected Companies</option></select></div>
            <div><Label>Channels</Label><div className="mt-2 flex flex-wrap gap-2">{['dashboard_banner','email','popup'].map((c) => <label key={c} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.channels.includes(c)} onChange={(e) => setForm({ ...form, channels: e.target.checked ? [...form.channels, c] : form.channels.filter((x) => x !== c) })} />{c}</label>)}</div></div>
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.body}>Save Draft</Button>
        </Card>
      )}

      <div className="grid gap-4">
        {items.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-violet-500" /><h3 className="font-semibold">{a.title}</h3></div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{a.body}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Target: {a.targetType} · {formatDate(a.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge>{a.status}</Badge>
                {a.status === 'draft' && <Button size="sm" onClick={() => publishMutation.mutate(a.id)}>Publish</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
