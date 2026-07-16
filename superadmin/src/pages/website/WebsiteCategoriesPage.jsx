import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';
import { SeoFields, seoFromForm, seoToForm } from '../../components/website/SeoFields';

const EMPTY = { title: '', slug: '', description: '', image: '', banner: '', type: 'trek', status: 'published', enabled: true, ...seoToForm() };

export default function WebsiteCategoriesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data } = useQuery({
    queryKey: ['website-categories'],
    queryFn: () => superAdminApi.listWebsiteCategories({ limit: 100 }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, ...seoFromForm(form), slug: form.slug || undefined };
      return editingId
        ? superAdminApi.updateWebsiteCategory(editingId, payload)
        : superAdminApi.createWebsiteCategory(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-categories'] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-categories'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organize treks, blogs, and destinations.">
        <Button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm((v) => !v); }}><Plus className="h-4 w-4" /> New Category</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['trek', 'blog', 'destination', 'general'].map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div><Label>Image</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
            <div><Label>Banner</Label><Input value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <SeoFields form={form} setForm={setForm} />
          <Button onClick={() => saveMutation.mutate()} disabled={!form.title}>{editingId ? 'Update' : 'Create'}</Button>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-xs text-[var(--text-muted)]">{item.type} · /{item.slug}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditingId(item.id); setForm({ ...EMPTY, ...seoToForm(item), ...item }); setShowForm(true); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
