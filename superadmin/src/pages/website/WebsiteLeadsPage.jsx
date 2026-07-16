import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Select, Textarea } from '../../components/ui/input';
import { StatusBadge } from '../../components/website/StatusBadge';
import { formatDate } from '../../lib/utils';

export default function WebsiteLeadsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);

  const params = useMemo(() => ({
    type: type || undefined,
    status: status || undefined,
    q: q || undefined,
    limit: 50,
  }), [type, status, q]);

  const { data, isLoading } = useQuery({
    queryKey: ['website-leads', params],
    queryFn: () => superAdminApi.listWebsiteLeads(params).then((r) => r.data),
  });

  const { data: adminsData } = useQuery({
    queryKey: ['admins'],
    queryFn: () => superAdminApi.listAdmins().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: () => superAdminApi.updateWebsiteLead(editing.id, {
      status: editing.status,
      notes: editing.notes,
      name: editing.name,
      email: editing.email,
      phone: editing.phone,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['website-leads'] });
      setEditing(null);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedTo }) => superAdminApi.assignWebsiteLead(id, { assignedTo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-leads'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => superAdminApi.deleteWebsiteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-leads'] }),
  });

  async function exportCsv() {
    const res = await superAdminApi.exportWebsiteLeads({ type: type || undefined, status: status || undefined });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const items = data?.data || [];
  const admins = adminsData?.data || adminsData?.admins || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Forms & Leads" description="Booking enquiries, contact forms, newsletter, and callback requests.">
        <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export Excel/CSV</Button>
      </PageHeader>

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-40" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {['booking', 'contact', 'newsletter', 'callback'].map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {editing && (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                {['new', 'contacted', 'qualified', 'converted', 'closed', 'spam'].map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => updateMutation.mutate()}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? <div className="py-12 text-center">Loading leads…</div> : (
        <div className="grid gap-3">
          {items.map((lead) => (
            <Card key={lead.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{lead.name || lead.email || 'Lead'}</h3>
                    <StatusBadge status={lead.type} />
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{lead.email} · {lead.phone}</p>
                  {lead.message && <p className="mt-2 text-sm">{lead.message}</p>}
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {lead.trekTitle || '—'} · {formatDate(lead.createdAt)}
                    {lead.assignedToName ? ` · Assigned: ${lead.assignedToName}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    className="w-44"
                    value={lead.assignedTo || ''}
                    onChange={(e) => e.target.value && assignMutation.mutate({ id: lead.id, assignedTo: e.target.value })}
                  >
                    <option value="">Assign lead…</option>
                    {admins.map((a) => (
                      <option key={a.id || a._id} value={a.id || a._id}>{a.name}</option>
                    ))}
                  </Select>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(lead)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(lead.id)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
          {!items.length && <p className="text-sm text-[var(--text-muted)]">No leads found.</p>}
        </div>
      )}
    </div>
  );
}
