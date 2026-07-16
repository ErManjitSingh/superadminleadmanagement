import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteHomepagePage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['website-homepage'],
    queryFn: () => superAdminApi.listHomepageSections().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (
      payload.id
        ? superAdminApi.updateHomepageSection(payload.id, payload)
        : superAdminApi.upsertHomepageSection(payload)
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-homepage'] });
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => superAdminApi.updateHomepageSection(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-homepage'] }),
  });

  const sections = data?.data || [];

  if (isLoading) return <div className="py-20 text-center">Loading homepage…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Management"
        description="Edit every homepage section — hero, stats, featured content, CTAs, footer. Enable, schedule, and reorder."
      />

      {editing && (
        <Card className="space-y-4 p-6">
          <h3 className="font-semibold">Edit: {editing.key}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><Label>Subtitle</Label><Input value={editing.subtitle || ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></div>
            <div><Label>CTA Label</Label><Input value={editing.ctaLabel || ''} onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })} /></div>
            <div><Label>CTA URL</Label><Input value={editing.ctaUrl || ''} onChange={(e) => setEditing({ ...editing, ctaUrl: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={editing.status || 'published'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </Select>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></div>
            <div><Label>Schedule From</Label><Input type="datetime-local" value={editing.scheduledFrom ? String(editing.scheduledFrom).slice(0, 16) : ''} onChange={(e) => setEditing({ ...editing, scheduledFrom: e.target.value || null })} /></div>
            <div><Label>Schedule To</Label><Input type="datetime-local" value={editing.scheduledTo ? String(editing.scheduledTo).slice(0, 16) : ''} onChange={(e) => setEditing({ ...editing, scheduledTo: e.target.value || null })} /></div>
            <div className="sm:col-span-2">
              <Label>Content (JSON)</Label>
              <Textarea
                rows={6}
                value={typeof editing.content === 'string' ? editing.content : JSON.stringify(editing.content || {}, null, 2)}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Media URLs (one per line)</Label>
              <Textarea
                rows={3}
                value={(editing.media || []).join('\n')}
                onChange={(e) => setEditing({ ...editing, media: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                let content = editing.content;
                if (typeof content === 'string') {
                  try { content = JSON.parse(content || '{}'); } catch { /* keep string */ }
                }
                saveMutation.mutate({ ...editing, content, key: editing.key });
              }}
            >
              Save Section
            </Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {sections.map((section) => (
          <Card key={section.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{section.title || section.key}</h3>
                <StatusBadge status={section.status} />
                {!section.enabled && <StatusBadge status="disabled" />}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{section.key} · order {section.sortOrder}</p>
              {section.subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{section.subtitle}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing({ ...section, content: section.content || {} })}>Edit</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleMutation.mutate({ id: section.id, enabled: !section.enabled })}
              >
                {section.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
