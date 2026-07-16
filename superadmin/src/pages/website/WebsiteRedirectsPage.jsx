import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteRedirectsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ fromPath: '', toPath: '', type: '301', notes: '', is404Handler: false, enabled: true });

  const { data } = useQuery({
    queryKey: ['website-redirects'],
    queryFn: () => superAdminApi.listWebsiteRedirects({ limit: 200 }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => (editingId
      ? superAdminApi.updateWebsiteRedirect(editingId, form)
      : superAdminApi.createWebsiteRedirect(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-redirects'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteRedirect(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-redirects'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Redirect Manager" description="Manage 301 / 302 redirects and 404 handlers.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> New Redirect</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>From Path</Label><Input value={form.fromPath} onChange={(e) => setForm({ ...form, fromPath: e.target.value })} placeholder="/old-trek" /></div>
            <div><Label>To Path</Label><Input value={form.toPath} onChange={(e) => setForm({ ...form, toPath: e.target.value })} placeholder="/treks/new-slug" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="301">301 Permanent</option>
                <option value="302">302 Temporary</option>
                <option value="410">410 Gone</option>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is404Handler} onChange={(e) => setForm({ ...form, is404Handler: e.target.checked })} /> 404 handler</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
            </div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!form.fromPath || !form.toPath}>{editingId ? 'Update' : 'Create'}</Button>
        </Card>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-semibold">{item.fromPath}</code>
                <span className="text-[var(--text-muted)]">→</span>
                <code className="text-sm">{item.toPath}</code>
                <StatusBadge status={item.type} />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.hitCount || 0} hits {item.is404Handler ? '· 404 handler' : ''}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditingId(item.id); setForm(item); setShowForm(true); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
