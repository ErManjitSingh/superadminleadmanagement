import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminApi } from '../../api/superadmin';
import { PageHeader } from '../../components/shared/PageHeader';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Textarea } from '../../components/ui/input';

export default function WebsiteSettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['website-settings'],
    queryFn: () => superAdminApi.getWebsiteSettings().then((r) => r.data.settings),
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        emails: data.emails || {},
        socialLinks: data.socialLinks || {},
        smtp: data.smtp || {},
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => superAdminApi.updateWebsiteSettings(form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['website-settings'] }),
  });

  if (isLoading || !form) return <div className="py-20 text-center">Loading settings…</div>;

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setNested = (group, key, value) => setForm((prev) => ({
    ...prev,
    [group]: { ...(prev[group] || {}), [key]: value },
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Website Settings" description="Logo, contact info, analytics, SMTP, and social links for the trekking website.">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save Settings</Button>
      </PageHeader>

      <Card className="space-y-4 p-6">
        <h3 className="font-semibold">Brand</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Business Name</Label><Input value={form.businessName || ''} onChange={(e) => set('businessName', e.target.value)} /></div>
          <div><Label>Copyright</Label><Input value={form.copyright || ''} onChange={(e) => set('copyright', e.target.value)} /></div>
          <div><Label>Logo URL</Label><Input value={form.logo || ''} onChange={(e) => set('logo', e.target.value)} /></div>
          <div><Label>Favicon URL</Label><Input value={form.favicon || ''} onChange={(e) => set('favicon', e.target.value)} /></div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="font-semibold">Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Primary Email</Label><Input value={form.emails?.primary || ''} onChange={(e) => setNested('emails', 'primary', e.target.value)} /></div>
          <div><Label>Support Email</Label><Input value={form.emails?.support || ''} onChange={(e) => setNested('emails', 'support', e.target.value)} /></div>
          <div><Label>Bookings Email</Label><Input value={form.emails?.bookings || ''} onChange={(e) => setNested('emails', 'bookings', e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Textarea rows={2} value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="font-semibold">Analytics & Pixels</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Google Analytics ID</Label><Input value={form.googleAnalyticsId || ''} onChange={(e) => set('googleAnalyticsId', e.target.value)} /></div>
          <div><Label>Google Tag Manager ID</Label><Input value={form.googleTagManagerId || ''} onChange={(e) => set('googleTagManagerId', e.target.value)} /></div>
          <div><Label>Search Console Verification</Label><Input value={form.googleSearchConsole || ''} onChange={(e) => set('googleSearchConsole', e.target.value)} /></div>
          <div><Label>Meta Pixel ID</Label><Input value={form.metaPixelId || ''} onChange={(e) => set('metaPixelId', e.target.value)} /></div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="font-semibold">SMTP</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Host</Label><Input value={form.smtp?.host || ''} onChange={(e) => setNested('smtp', 'host', e.target.value)} /></div>
          <div><Label>Port</Label><Input type="number" value={form.smtp?.port || 587} onChange={(e) => setNested('smtp', 'port', Number(e.target.value))} /></div>
          <div><Label>User</Label><Input value={form.smtp?.user || ''} onChange={(e) => setNested('smtp', 'user', e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" value={form.smtp?.password || ''} onChange={(e) => setNested('smtp', 'password', e.target.value)} /></div>
          <div><Label>From Name</Label><Input value={form.smtp?.fromName || ''} onChange={(e) => setNested('smtp', 'fromName', e.target.value)} /></div>
          <div><Label>From Email</Label><Input value={form.smtp?.fromEmail || ''} onChange={(e) => setNested('smtp', 'fromEmail', e.target.value)} /></div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="font-semibold">Social Links</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {['facebook', 'instagram', 'youtube', 'twitter', 'linkedin'].map((key) => (
            <div key={key}>
              <Label className="capitalize">{key}</Label>
              <Input value={form.socialLinks?.[key] || ''} onChange={(e) => setNested('socialLinks', key, e.target.value)} />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.maintenanceMode} onChange={(e) => set('maintenanceMode', e.target.checked)} />
          Maintenance mode
        </label>
      </Card>
    </div>
  );
}
