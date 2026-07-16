import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader, EmptyState } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';
import { SeoFields, seoFromForm, seoToForm } from '../../components/website/SeoFields';

const EMPTY = {
  title: '', slug: '', region: '', state: '', country: 'India', overview: '', travelGuide: '',
  featuredImage: '', bannerImage: '', gallery: '', weatherSummary: '', bestMonths: '',
  byAir: '', byRail: '', byRoad: '', status: 'draft', isFeatured: false, enabled: true,
  ...seoToForm(),
};

export default function WebsiteDestinationsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [q, setQ] = useState('');

  const params = useMemo(() => ({ q: q || undefined, limit: 50 }), [q]);
  const { data, isLoading } = useQuery({
    queryKey: ['website-destinations', params],
    queryFn: () => superAdminApi.listWebsiteDestinations(params).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        region: form.region,
        state: form.state,
        country: form.country,
        overview: form.overview,
        travelGuide: form.travelGuide,
        featuredImage: form.featuredImage,
        bannerImage: form.bannerImage,
        gallery: String(form.gallery || '').split('\n').map((x) => x.trim()).filter(Boolean),
        weather: {
          summary: form.weatherSummary,
          bestMonths: String(form.bestMonths || '').split(',').map((x) => x.trim()).filter(Boolean),
        },
        transport: { byAir: form.byAir, byRail: form.byRail, byRoad: form.byRoad },
        status: form.status,
        isFeatured: !!form.isFeatured,
        enabled: form.enabled !== false,
        ...seoFromForm(form),
      };
      return editingId
        ? superAdminApi.updateWebsiteDestination(editingId, payload)
        : superAdminApi.createWebsiteDestination(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-destinations'] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteDestination(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-destinations'] }),
  });

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      ...EMPTY,
      ...seoToForm(item),
      title: item.title || '',
      slug: item.slug || '',
      region: item.region || '',
      state: item.state || '',
      country: item.country || 'India',
      overview: item.overview || '',
      travelGuide: item.travelGuide || '',
      featuredImage: item.featuredImage || '',
      bannerImage: item.bannerImage || '',
      gallery: (item.gallery || []).join('\n'),
      weatherSummary: item.weather?.summary || '',
      bestMonths: (item.weather?.bestMonths || []).join(', '),
      byAir: item.transport?.byAir || '',
      byRail: item.transport?.byRail || '',
      byRoad: item.transport?.byRoad || '',
      status: item.status || 'draft',
      isFeatured: !!item.isFeatured,
      enabled: item.enabled !== false,
    });
    setShowForm(true);
  }

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Destination Management" description="CRUD for destinations — overview, travel guide, weather, transport, SEO.">
        <Button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm((v) => !v); }}><Plus className="h-4 w-4" /> New Destination</Button>
      </PageHeader>

      <Input className="max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div><Label>Featured Image</Label><Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} /></div>
            <div><Label>Banner Image</Label><Input value={form.bannerImage} onChange={(e) => setForm({ ...form, bannerImage: e.target.value })} /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label></div>
          </div>
          <div><Label>Overview</Label><Textarea rows={3} value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} /></div>
          <div><Label>Travel Guide</Label><Textarea rows={4} value={form.travelGuide} onChange={(e) => setForm({ ...form, travelGuide: e.target.value })} /></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div><Label>Weather Summary</Label><Textarea rows={2} value={form.weatherSummary} onChange={(e) => setForm({ ...form, weatherSummary: e.target.value })} /></div>
            <div><Label>Best Months (comma separated)</Label><Input value={form.bestMonths} onChange={(e) => setForm({ ...form, bestMonths: e.target.value })} /></div>
            <div><Label>By Air</Label><Textarea rows={2} value={form.byAir} onChange={(e) => setForm({ ...form, byAir: e.target.value })} /></div>
            <div><Label>By Rail</Label><Textarea rows={2} value={form.byRail} onChange={(e) => setForm({ ...form, byRail: e.target.value })} /></div>
            <div><Label>By Road</Label><Textarea rows={2} value={form.byRoad} onChange={(e) => setForm({ ...form, byRoad: e.target.value })} /></div>
            <div><Label>Gallery URLs</Label><Textarea rows={2} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} /></div>
          </div>
          <SeoFields form={form} setForm={setForm} />
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title}>{editingId ? 'Update' : 'Create'}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? <div className="py-12 text-center">Loading…</div> : !items.length ? (
        <EmptyState title="No destinations" description="Add destinations for the trekking website." />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold">{item.title}</h3><StatusBadge status={item.status} /></div>
                <p className="text-xs text-[var(--text-muted)]">{item.region} · {item.state}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
