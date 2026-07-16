import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea, Select } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';

export default function WebsiteTestimonialsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ customerName: '', customerImage: '', videoUrl: '', rating: 5, location: '', content: '', status: 'published', isFeatured: false, enabled: true });
  const [reviewStatus, setReviewStatus] = useState('pending');

  const { data } = useQuery({
    queryKey: ['website-testimonials'],
    queryFn: () => superAdminApi.listWebsiteTestimonials({ limit: 100 }).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['website-reviews', reviewStatus],
    queryFn: () => superAdminApi.listWebsiteReviews({ status: reviewStatus, limit: 50 }).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => (editingId
      ? superAdminApi.updateWebsiteTestimonial(editingId, form)
      : superAdminApi.createWebsiteTestimonial(form)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-testimonials'] });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteTestimonial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-testimonials'] }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }) => superAdminApi.moderateWebsiteReview(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-reviews'] }),
  });

  const items = data?.data || [];
  const pending = reviews?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Testimonials" description="Customer stories with image, video, rating, and location. Moderate trek reviews below.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> New Testimonial</Button>
      </PageHeader>

      {showForm && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Customer Name</Label><Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.customerImage} onChange={(e) => setForm({ ...form, customerImage: e.target.value })} /></div>
            <div><Label>Video URL</Label><Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} /></div>
            <div><Label>Rating</Label><Input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Content</Label><Textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!form.customerName || !form.content}>{editingId ? 'Update' : 'Create'}</Button>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{item.customerName}</h3>
                <p className="text-xs text-[var(--text-muted)]">{item.location} · {item.rating}/5</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.content}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setEditingId(item.id); setForm(item); setShowForm(true); }}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Pending Reviews</h3>
          <Select className="w-40" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </div>
        {pending.map((r) => (
          <div key={r.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <p className="text-sm font-medium">{r.customerName} · {r.rating}/5</p>
              <p className="text-sm text-[var(--text-secondary)]">{r.content}</p>
            </div>
            {r.status === 'pending' && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => moderateMutation.mutate({ id: r.id, status: 'approved' })}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => moderateMutation.mutate({ id: r.id, status: 'rejected' })}>Reject</Button>
              </div>
            )}
          </div>
        ))}
        {!pending.length && <p className="text-sm text-[var(--text-muted)]">No reviews in this status.</p>}
      </Card>
    </div>
  );
}
