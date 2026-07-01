import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', password: '' });

  const saveMutation = useMutation({
    mutationFn: () => superAdminApi.updateProfile({ name: form.name, password: form.password || undefined }),
    onSuccess: () => refreshUser?.(),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your platform admin account." />
      <Card className="max-w-lg space-y-4 p-6">
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
        <div><Label>New Password</Label><Input type="password" placeholder="Leave blank to keep current" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save Changes</Button>
      </Card>
    </div>
  );
}
