import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteMenusPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['website-menus'],
    queryFn: () => superAdminApi.listWebsiteMenus().then((r) => r.data),
  });

  const menus = data?.data || [];

  useEffect(() => {
    if (!menus.length) return;
    const current = menus.find((m) => m.id === activeId) || menus[0];
    setActiveId(current.id);
    setDraft({
      name: current.name,
      status: current.status,
      enabled: current.enabled,
      itemsJson: JSON.stringify(current.items || [], null, 2),
    });
  }, [menus, activeId]);

  const saveMutation = useMutation({
    mutationFn: () => {
      let items = [];
      try {
        items = JSON.parse(draft.itemsJson || '[]');
      } catch {
        throw new Error('Invalid JSON for menu items');
      }
      return superAdminApi.updateWebsiteMenu(activeId, {
        name: draft.name,
        status: draft.status,
        enabled: draft.enabled,
        items,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-menus'] }),
  });

  if (isLoading || !draft) return <div className="py-20 text-center">Loading menus…</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Menu Management" description="Header, footer, and mega menus with nested items and sorting." />

      <div className="flex flex-wrap gap-2">
        {menus.map((menu) => (
          <Button
            key={menu.id}
            size="sm"
            variant={menu.id === activeId ? 'default' : 'secondary'}
            onClick={() => setActiveId(menu.id)}
          >
            {menu.location}
          </Button>
        ))}
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold capitalize">{menus.find((m) => m.id === activeId)?.location} menu</h3>
          <StatusBadge status={draft.status} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Enabled</label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.status === 'published'} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'published' : 'draft' })} />
              Published
            </label>
          </div>
        </div>
        <div>
          <Label>Menu Items JSON (supports nested children)</Label>
          <Textarea
            rows={16}
            value={draft.itemsJson}
            onChange={(e) => setDraft({ ...draft, itemsJson: e.target.value })}
            className="font-mono text-xs"
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Example item: {`{"label":"Treks","url":"/treks","enabled":true,"sortOrder":0,"children":[]}`}
          </p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save Menu</Button>
        {saveMutation.isError && <p className="text-sm text-red-600">{saveMutation.error?.message || 'Failed to save'}</p>}
      </Card>
    </div>
  );
}
