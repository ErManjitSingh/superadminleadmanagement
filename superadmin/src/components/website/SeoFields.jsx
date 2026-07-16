import { Input, Label, Textarea, Select } from '../ui/input';

const SEO_DEFAULTS = {
  seoTitle: '',
  metaDescription: '',
  keywords: '',
  canonical: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterCard: 'summary_large_image',
  robots: 'index,follow',
  noIndex: false,
  sitemapPriority: 0.5,
  changeFrequency: 'weekly',
  schemaJson: '',
};

export function seoFromForm(form) {
  const keywords = typeof form.keywords === 'string'
    ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : form.keywords || [];
  return {
    seoTitle: form.seoTitle || '',
    metaDescription: form.metaDescription || '',
    keywords,
    canonical: form.canonical || '',
    ogTitle: form.ogTitle || '',
    ogDescription: form.ogDescription || '',
    ogImage: form.ogImage || '',
    twitterCard: form.twitterCard || 'summary_large_image',
    robots: form.robots || 'index,follow',
    noIndex: !!form.noIndex,
    sitemapPriority: Number(form.sitemapPriority) || 0.5,
    changeFrequency: form.changeFrequency || 'weekly',
    schemaJson: form.schemaJson || '',
  };
}

export function seoToForm(item = {}) {
  return {
    ...SEO_DEFAULTS,
    ...item,
    keywords: Array.isArray(item.keywords) ? item.keywords.join(', ') : item.keywords || '',
  };
}

export function SeoFields({ form, setForm }) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] p-4">
      <h3 className="text-sm font-semibold">SEO</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>SEO Title</Label><Input value={form.seoTitle || ''} onChange={(e) => set('seoTitle', e.target.value)} /></div>
        <div><Label>Canonical URL</Label><Input value={form.canonical || ''} onChange={(e) => set('canonical', e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Meta Description</Label><Textarea rows={2} value={form.metaDescription || ''} onChange={(e) => set('metaDescription', e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Keywords (comma separated)</Label><Input value={form.keywords || ''} onChange={(e) => set('keywords', e.target.value)} /></div>
        <div><Label>OG Title</Label><Input value={form.ogTitle || ''} onChange={(e) => set('ogTitle', e.target.value)} /></div>
        <div><Label>OG Image URL</Label><Input value={form.ogImage || ''} onChange={(e) => set('ogImage', e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>OG Description</Label><Textarea rows={2} value={form.ogDescription || ''} onChange={(e) => set('ogDescription', e.target.value)} /></div>
        <div>
          <Label>Twitter Card</Label>
          <Select value={form.twitterCard || 'summary_large_image'} onChange={(e) => set('twitterCard', e.target.value)}>
            <option value="summary">summary</option>
            <option value="summary_large_image">summary_large_image</option>
          </Select>
        </div>
        <div><Label>Robots</Label><Input value={form.robots || 'index,follow'} onChange={(e) => set('robots', e.target.value)} /></div>
        <div><Label>Sitemap Priority</Label><Input type="number" step="0.1" min="0" max="1" value={form.sitemapPriority ?? 0.5} onChange={(e) => set('sitemapPriority', e.target.value)} /></div>
        <div>
          <Label>Change Frequency</Label>
          <Select value={form.changeFrequency || 'weekly'} onChange={(e) => set('changeFrequency', e.target.value)}>
            {['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.noIndex} onChange={(e) => set('noIndex', e.target.checked)} />
            NoIndex
          </label>
        </div>
        <div className="sm:col-span-2"><Label>Schema JSON-LD</Label><Textarea rows={4} value={form.schemaJson || ''} onChange={(e) => set('schemaJson', e.target.value)} placeholder='{"@context":"https://schema.org",...}' /></div>
      </div>
    </div>
  );
}
