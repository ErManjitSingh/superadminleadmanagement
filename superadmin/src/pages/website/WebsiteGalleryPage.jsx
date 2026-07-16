import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteGalleryPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', coverImage: '', images: '', status: 'published', enabled: true });

  const { data } = useQuery({
    queryKey: ['website-galleries'],
    queryFn: () => superAdminApi.listWebsiteGalleries({ limit: 100 }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        images: String(form.images || '').split('\n').map((url) => url.trim()).filter(Boolean).map((url, i) => ({ url, sortOrder: i })),
      };
      return editingId
        ? superAdminApi.updateWebsiteGallery(editingId, payload)
        : superAdminApi.createWebsiteGallery(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-galleries'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteGallery(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-galleries'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Gallery" description="Curated photo galleries for homepage and trek pages.">
        <Button onClick={() => { setEditingId(null); setForm({ title: '', slug: '', description: '', coverImage: '', images: '', status: 'published', enabled: true }); setShowForm((v) => !v); }}><Plus className="h-4 w-4" /> New Gallery</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Cover Image</Label><Input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Image URLs (one per line)</Label><Textarea rows={5} value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!form.title}>{editingId ? 'Update' : 'Create'}</Button>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{item.title}</h3>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{(item.images || []).length} images</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => {
                setEditingId(item.id);
                setForm({
                  title: item.title,
                  slug: item.slug,
                  description: item.description || '',
                  coverImage: item.coverImage || '',
                  images: (item.images || []).map((i) => i.url).join('\n'),
                  status: item.status,
                  enabled: item.enabled,
                });
                setShowForm(true);
              }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
