import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteFaqsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', sortOrder: 0, status: 'published', enabled: true });

  const { data } = useQuery({
    queryKey: ['website-faqs'],
    queryFn: () => superAdminApi.listWebsiteFaqs({ limit: 200, sort: 'sortOrder' }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => (editingId
      ? superAdminApi.updateWebsiteFaq(editingId, form)
      : superAdminApi.createWebsiteFaq(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-faqs'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteFaq(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-faqs'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="FAQs" description="Categorized frequently asked questions with sorting.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> New FAQ</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div><Label>Question</Label><Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
          <div><Label>Answer</Label><Textarea rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!form.question || !form.answer}>{editingId ? 'Update' : 'Create'}</Button>
        </Card>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2"><h3 className="font-semibold">{item.question}</h3><StatusBadge status={item.status} /></div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.answer}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.category} · order {item.sortOrder}</p>
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
