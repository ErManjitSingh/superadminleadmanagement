import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../api/superadmin';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input, Label } from '../components/ui/input';

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'smtp', label: 'SMTP' },
  { id: 'whatsapp', label: 'WhatsApp API' },
  { id: 'sms', label: 'SMS Gateway' },
  { id: 'storage', label: 'Cloudinary / AWS' },
  { id: 'maps', label: 'Google Maps' },
  { id: 'branding', label: 'Branding' },
  { id: 'billing', label: 'Billing Defaults' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('general');
  const [draft, setDraft] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['settings', category],
    queryFn: () => superAdminApi.getSettings(category).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (settings) => superAdminApi.patchSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setDraft({});
    },
  });

  const settings = data || [];

  function handleChange(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-[var(--text-secondary)]">Platform-wide configuration for all tenants</p>
        </div>
        <Button onClick={() => saveMutation.mutate(draft)} disabled={!Object.keys(draft).length || saveMutation.isPending}>
          Save changes
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c.id} variant={category === c.id ? 'default' : 'secondary'} size="sm" onClick={() => setCategory(c.id)}>
            {c.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{CATEGORIES.find((c) => c.id === category)?.label}</CardTitle>
          <CardDescription>Changes apply platform-wide</CardDescription>
        </CardHeader>
        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {settings.map((s) => (
              <div key={s.key}>
                <Label>{s.label || s.key}</Label>
                <Input
                  type={s.isSecret ? 'password' : typeof s.value === 'number' ? 'number' : 'text'}
                  value={draft[s.key] ?? (s.isSecret && s.hasValue ? '••••••••' : String(s.value ?? ''))}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
