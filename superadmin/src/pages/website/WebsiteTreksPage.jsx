import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Archive } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader, EmptyState } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';
import { SeoFields, seoFromForm, seoToForm } from '../../components/website/SeoFields';
import { formatCurrency } from '../../lib/utils';

const EMPTY = {
  title: '', slug: '', location: '', region: '', state: '', duration: '',
  difficulty: 'moderate', altitude: '', distance: '', overview: '',
  highlights: '', itinerary: '', gallery: '', videos: '', featuredImage: '',
  bestTime: '', fitness: '', packingList: '', thingsToCarry: '',
  inclusions: '', exclusions: '', basePrice: 0, discountPercent: 0,
  groupMin: 1, groupMax: 20, faqs: '', status: 'draft', isFeatured: false, enabled: true,
  ...seoToForm(),
};

function lines(value) {
  return String(value || '').split('\n').map((x) => x.trim()).filter(Boolean);
}

function parseItinerary(text) {
  return lines(text).map((line, i) => {
    const [title, ...rest] = line.split('|');
    return { day: i + 1, title: title?.trim() || `Day ${i + 1}`, description: rest.join('|').trim() };
  });
}

function parseFaqs(text) {
  return lines(text).map((line) => {
    const [question, ...rest] = line.split('|');
    return { question: question?.trim() || '', answer: rest.join('|').trim() };
  }).filter((f) => f.question);
}

export default function WebsiteTreksPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const params = useMemo(() => ({ q: q || undefined, status: status || undefined, limit: 50 }), [q, status]);

  const { data, isLoading } = useQuery({
    queryKey: ['website-treks', params],
    queryFn: () => superAdminApi.listWebsiteTreks(params).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        location: form.location,
        region: form.region,
        state: form.state,
        duration: form.duration,
        difficulty: form.difficulty,
        altitude: form.altitude,
        distance: form.distance,
        overview: form.overview,
        highlights: lines(form.highlights),
        itinerary: parseItinerary(form.itinerary),
        gallery: lines(form.gallery),
        videos: lines(form.videos),
        featuredImage: form.featuredImage,
        bestTime: form.bestTime,
        fitness: form.fitness,
        packingList: lines(form.packingList),
        thingsToCarry: lines(form.thingsToCarry),
        inclusions: lines(form.inclusions),
        exclusions: lines(form.exclusions),
        pricing: {
          basePrice: Number(form.basePrice) || 0,
          discountPercent: Number(form.discountPercent) || 0,
          currency: 'INR',
        },
        groupSize: { min: Number(form.groupMin) || 1, max: Number(form.groupMax) || 20 },
        faqs: parseFaqs(form.faqs),
        status: form.status,
        isFeatured: !!form.isFeatured,
        enabled: form.enabled !== false,
        ...seoFromForm(form),
      };
      return editingId
        ? superAdminApi.updateWebsiteTrek(editingId, payload)
        : superAdminApi.createWebsiteTrek(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-treks'] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteTrek(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-treks'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => superAdminApi.duplicateWebsiteTrek(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-treks'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => superAdminApi.archiveWebsiteTrek(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-treks'] }),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => superAdminApi.updateWebsiteTrek(id, { status: 'published' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-treks'] }),
  });

  function openEdit(trek) {
    setEditingId(trek.id);
    setForm({
      ...EMPTY,
      ...seoToForm(trek),
      title: trek.title || '',
      slug: trek.slug || '',
      location: trek.location || '',
      region: trek.region || '',
      state: trek.state || '',
      duration: trek.duration || '',
      difficulty: trek.difficulty || 'moderate',
      altitude: trek.altitude || '',
      distance: trek.distance || '',
      overview: trek.overview || '',
      highlights: (trek.highlights || []).join('\n'),
      itinerary: (trek.itinerary || []).map((d) => `${d.title || ''}|${d.description || ''}`).join('\n'),
      gallery: (trek.gallery || []).join('\n'),
      videos: (trek.videos || []).join('\n'),
      featuredImage: trek.featuredImage || '',
      bestTime: trek.bestTime || '',
      fitness: trek.fitness || '',
      packingList: (trek.packingList || []).join('\n'),
      thingsToCarry: (trek.thingsToCarry || []).join('\n'),
      inclusions: (trek.inclusions || []).join('\n'),
      exclusions: (trek.exclusions || []).join('\n'),
      basePrice: trek.pricing?.basePrice || 0,
      discountPercent: trek.pricing?.discountPercent || 0,
      groupMin: trek.groupSize?.min || 1,
      groupMax: trek.groupSize?.max || 20,
      faqs: (trek.faqs || []).map((f) => `${f.question}|${f.answer}`).join('\n'),
      status: trek.status || 'draft',
      isFeatured: !!trek.isFeatured,
      enabled: trek.enabled !== false,
    });
    setShowForm(true);
  }

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Trek Management" description="Full CMS for treks — itinerary, pricing, galleries, SEO, publish workflow.">
        <Button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm((v) => !v); }}>
          <Plus className="h-4 w-4" /> New Trek
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search treks…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from title" /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
            <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="6 Days / 5 Nights" /></div>
            <div>
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {['easy', 'moderate', 'difficult', 'challenging', 'extreme'].map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div><Label>Altitude</Label><Input value={form.altitude} onChange={(e) => setForm({ ...form, altitude: e.target.value })} /></div>
            <div><Label>Distance</Label><Input value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} /></div>
            <div><Label>Base Price</Label><Input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} /></div>
            <div><Label>Discount %</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div><Label>Featured Image URL</Label><Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} /></div>
            <div><Label>Best Time</Label><Input value={form.bestTime} onChange={(e) => setForm({ ...form, bestTime: e.target.value })} /></div>
            <div><Label>Fitness</Label><Input value={form.fitness} onChange={(e) => setForm({ ...form, fitness: e.target.value })} /></div>
            <div><Label>Group Min</Label><Input type="number" value={form.groupMin} onChange={(e) => setForm({ ...form, groupMin: e.target.value })} /></div>
            <div><Label>Group Max</Label><Input type="number" value={form.groupMax} onChange={(e) => setForm({ ...form, groupMax: e.target.value })} /></div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
            </div>
          </div>

          <div><Label>Overview</Label><Textarea rows={4} value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} /></div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div><Label>Highlights (one per line)</Label><Textarea rows={4} value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} /></div>
            <div><Label>Day-wise Itinerary (Title|Description per line)</Label><Textarea rows={4} value={form.itinerary} onChange={(e) => setForm({ ...form, itinerary: e.target.value })} /></div>
            <div><Label>Inclusions</Label><Textarea rows={3} value={form.inclusions} onChange={(e) => setForm({ ...form, inclusions: e.target.value })} /></div>
            <div><Label>Exclusions</Label><Textarea rows={3} value={form.exclusions} onChange={(e) => setForm({ ...form, exclusions: e.target.value })} /></div>
            <div><Label>Packing List</Label><Textarea rows={3} value={form.packingList} onChange={(e) => setForm({ ...form, packingList: e.target.value })} /></div>
            <div><Label>Things To Carry</Label><Textarea rows={3} value={form.thingsToCarry} onChange={(e) => setForm({ ...form, thingsToCarry: e.target.value })} /></div>
            <div><Label>Gallery URLs</Label><Textarea rows={3} value={form.gallery} onChange={(e) => setForm({ ...form, gallery: e.target.value })} /></div>
            <div><Label>Video URLs</Label><Textarea rows={3} value={form.videos} onChange={(e) => setForm({ ...form, videos: e.target.value })} /></div>
            <div className="lg:col-span-2"><Label>FAQs (Question|Answer per line)</Label><Textarea rows={3} value={form.faqs} onChange={(e) => setForm({ ...form, faqs: e.target.value })} /></div>
          </div>

          <SeoFields form={form} setForm={setForm} />

          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
              {editingId ? 'Update Trek' : 'Create Trek'}
            </Button>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="py-12 text-center">Loading treks…</div>
      ) : !items.length ? (
        <EmptyState title="No treks yet" description="Create your first trek to power the website." action={<Button onClick={() => setShowForm(true)}>New Trek</Button>} />
      ) : (
        <div className="grid gap-4">
          {items.map((trek) => (
            <Card key={trek.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{trek.title}</h3>
                    <StatusBadge status={trek.status} />
                    {trek.isFeatured && <StatusBadge status="published" />}
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {trek.location || '—'} · {trek.duration || '—'} · {trek.difficulty}
                  </p>
                  <p className="mt-2 text-sm font-medium">{formatCurrency(trek.pricing?.basePrice || 0)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(trek)}>Edit</Button>
                  {trek.status !== 'published' && (
                    <Button size="sm" onClick={() => publishMutation.mutate(trek.id)}>Publish</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => duplicateMutation.mutate(trek.id)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => archiveMutation.mutate(trek.id)}><Archive className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(trek.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
