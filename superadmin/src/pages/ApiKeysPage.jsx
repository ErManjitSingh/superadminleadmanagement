import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Key, Plus } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { formatDate } from '../lib/utils';

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [secret, setSecret] = useState(null);

  const { data } = useQuery({ queryKey: ['api-keys'], queryFn: () => superAdminApi.listApiKeys().then((r) => r.data) });

  const createMutation = useMutation({
    mutationFn: () => superAdminApi.createApiKey({ name }),
    onSuccess: (res) => { setSecret(res.data.secret); qc.invalidateQueries({ queryKey: ['api-keys'] }); setName(''); },
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => superAdminApi.revokeApiKey(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="API Keys" description="Programmatic access to platform management APIs.">
        <div className="flex gap-2"><Input placeholder="Key name" value={name} onChange={(e) => setName(e.target.value)} className="w-48" /><Button onClick={() => createMutation.mutate()} disabled={!name}><Plus className="h-4 w-4" />Create</Button></div>
      </PageHeader>
      {secret && <Card className="border-amber-300 bg-amber-50 p-4 text-sm dark:bg-amber-950/30"><p className="font-semibold">Copy your key now — it won&apos;t be shown again:</p><code className="mt-2 block break-all rounded bg-black/10 p-2 font-mono text-xs">{secret}</code></Card>}
      <div className="space-y-3">
        {(data?.data || []).map((k) => (
          <Card key={k._id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3"><Key className="h-5 w-5 text-violet-500" /><div><p className="font-medium">{k.name}</p><p className="font-mono text-xs text-[var(--text-muted)]">{k.keyPrefix}…</p></div></div>
            <div className="flex items-center gap-2"><Badge className={k.status === 'active' ? 'bg-emerald-500/15 text-emerald-700' : ''}>{k.status}</Badge>{k.status === 'active' && <Button size="sm" variant="outline" onClick={() => revokeMutation.mutate(k._id)}>Revoke</Button>}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
