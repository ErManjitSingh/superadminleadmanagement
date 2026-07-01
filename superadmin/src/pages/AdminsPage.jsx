import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { formatDate } from '../lib/utils';

export default function AdminsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'platform_support' });

  const { data } = useQuery({ queryKey: ['admins'], queryFn: () => superAdminApi.listAdmins().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => superAdminApi.createAdmin(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admins'] }); setShowForm(false); },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Admins" description="Users who can access this super admin console.">
        <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" />Add Admin</Button>
      </PageHeader>
      {showForm && (
        <Card className="grid gap-4 p-6 sm:grid-cols-2">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div><Label>Role</Label><select className="flex h-10 w-full rounded-lg border px-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="super_admin">Super Admin</option><option value="platform_support">Platform Support</option></select></div>
          <Button onClick={() => createMutation.mutate()} className="sm:col-span-2">Create Admin</Button>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {(data?.data || []).map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 font-bold text-violet-600">{a.name[0]}</div>
              <div>
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-[var(--text-muted)]">{a.email}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Badge>{a.role}</Badge>
              <Badge className={a.status === 'active' ? 'bg-emerald-500/15 text-emerald-700' : ''}>{a.status}</Badge>
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Last login: {a.lastLogin ? formatDate(a.lastLogin) : 'Never'}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RolesPage() {
  const { data } = useQuery({ queryKey: ['admins'], queryFn: () => superAdminApi.listAdmins().then((r) => r.data) });
  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Platform-level roles — separate from tenant CRM roles." />
      <div className="grid gap-4 md:grid-cols-2">
        {(data?.roles || []).map((r) => (
          <Card key={r.slug} className="p-6">
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-violet-500" /><h3 className="font-semibold">{r.name}</h3></div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
