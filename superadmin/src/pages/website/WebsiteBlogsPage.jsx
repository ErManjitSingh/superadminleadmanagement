import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader, EmptyState } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';
import { SeoFields, seoFromForm, seoToForm } from '../../components/website/SeoFields';
import { formatDate } from '../../lib/utils';

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', contentMarkdown: '', editorMode: 'richtext',
  featuredImage: '', authorName: '', tags: '', status: 'draft', isFeatured: false, enabled: true,
  ...seoToForm(),
};

export default function WebsiteBlogsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [q, setQ] = useState('');

  const params = useMemo(() => ({ q: q || undefined, limit: 50 }), [q]);
  const { data, isLoading } = useQuery({
    queryKey: ['website-blogs', params],
    queryFn: () => superAdminApi.listWebsiteBlogs(params).then((r) => r.data),
  });

  const detailQuery = useQuery({
    queryKey: ['website-blog', editingId],
    queryFn: () => superAdminApi.getWebsiteBlog(editingId).then((r) => r.data.blog),
    enabled: !!editingId && showForm,
  });

  useEffect(() => {
    if (!detailQuery.data) return;
    const b = detailQuery.data;
    setForm({
      ...EMPTY,
      ...seoToForm(b),
      title: b.title || '',
      slug: b.slug || '',
      excerpt: b.excerpt || '',
      content: b.content || '',
      contentMarkdown: b.contentMarkdown || '',
      editorMode: b.editorMode || 'richtext',
      featuredImage: b.featuredImage || '',
      authorName: b.authorName || '',
      tags: (b.tags || []).join(', '),
      status: b.status || 'draft',
      isFeatured: !!b.isFeatured,
      enabled: b.enabled !== false,
    });
  }, [detailQuery.data]);

  useEffect(() => {
    if (!editingId || !showForm) return undefined;
    const timer = setInterval(() => {
      if (!form.title && !form.content && !form.contentMarkdown) return;
      superAdminApi.autosaveWebsiteBlog(editingId, {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        contentMarkdown: form.contentMarkdown,
        editorMode: form.editorMode,
        createRevision: false,
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [editingId, showForm, form.title, form.excerpt, form.content, form.contentMarkdown, form.editorMode]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        content: form.content,
        contentMarkdown: form.contentMarkdown,
        editorMode: form.editorMode,
        featuredImage: form.featuredImage,
        authorName: form.authorName,
        tags: String(form.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
        status: form.status,
        isFeatured: !!form.isFeatured,
        enabled: form.enabled !== false,
        ...seoFromForm(form),
      };
      return editingId
        ? superAdminApi.updateWebsiteBlog(editingId, payload)
        : superAdminApi.createWebsiteBlog(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-blogs'] });
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteBlog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-blogs'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (revisionId) => superAdminApi.restoreWebsiteBlogRevision(editingId, revisionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-blog', editingId] }),
  });

  const items = data?.data || [];
  const revisions = detailQuery.data?.revisions || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Blogs" description="Rich text / Markdown CMS with auto-save, revisions, tags, and SEO.">
        <Button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm((v) => !v); }}><Plus className="h-4 w-4" /> New Post</Button>
      </PageHeader>

      <Input className="max-w-xs" placeholder="Search posts…" value={q} onChange={(e) => setQ(e.target.value)} />

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><Label>Author</Label><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} /></div>
            <div><Label>Featured Image</Label><Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} /></div>
            <div><Label>Tags</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="himalaya, beginners" /></div>
            <div>
              <Label>Editor Mode</Label>
              <Select value={form.editorMode} onChange={(e) => setForm({ ...form, editorMode: e.target.value })}>
                <option value="richtext">Rich Text</option>
                <option value="markdown">Markdown</option>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div className="flex items-end"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label></div>
            <div className="sm:col-span-2"><Label>Excerpt</Label><Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></div>
            {form.editorMode === 'markdown' ? (
              <div className="sm:col-span-2"><Label>Markdown</Label><Textarea rows={12} value={form.contentMarkdown} onChange={(e) => setForm({ ...form, contentMarkdown: e.target.value })} /></div>
            ) : (
              <div className="sm:col-span-2"><Label>Content (HTML / Rich Text)</Label><Textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            )}
          </div>
          <SeoFields form={form} setForm={setForm} />
          {editingId && (
            <div className="rounded-xl border border-[var(--border)] p-4">
              <h4 className="mb-2 text-sm font-semibold">Revision History {detailQuery.data?.lastAutoSavedAt ? `· Autosaved ${formatDate(detailQuery.data.lastAutoSavedAt)}` : ''}</h4>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {revisions.slice().reverse().map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span>{r.title || 'Untitled'} · {formatDate(r.savedAt)}</span>
                    <Button size="sm" variant="outline" onClick={() => restoreMutation.mutate(r.id)}>Restore</Button>
                  </div>
                ))}
                {!revisions.length && <p className="text-xs text-[var(--text-muted)]">No revisions yet. Autosave runs every 30s while editing.</p>}
              </div>
              <Button
                className="mt-3"
                size="sm"
                variant="secondary"
                onClick={() => superAdminApi.autosaveWebsiteBlog(editingId, { ...form, createRevision: true }).then(() => qc.invalidateQueries({ queryKey: ['website-blog', editingId] }))}
              >
                Save Revision Snapshot
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title}>{editingId ? 'Update Post' : 'Create Post'}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? <div className="py-12 text-center">Loading…</div> : !items.length ? (
        <EmptyState title="No blog posts" description="Write your first trekking blog post." />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2"><h3 className="font-semibold">{item.title}</h3><StatusBadge status={item.status} /></div>
                <p className="text-xs text-[var(--text-muted)]">{item.authorName || 'No author'} · {formatDate(item.publishedAt || item.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setEditingId(item.id); setShowForm(true); }}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
