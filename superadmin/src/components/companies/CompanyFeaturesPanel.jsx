import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle, Save } from 'lucide-react';
import { superAdminApi } from '../../api/superadmin';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const FEATURE_TOGGLES = [
  {
    key: 'whatsapp',
    label: 'WhatsApp API',
    description: 'WhatsApp Leads inbox, templates, and customer messaging. Enable only for companies that should use it.',
    highlight: true,
  },
  { key: 'crm', label: 'CRM & Leads', description: 'Core lead management module' },
  { key: 'bookings', label: 'Bookings & Operations', description: 'Operations and booking workflows' },
  { key: 'packages', label: 'Packages', description: 'Travel package builder' },
  { key: 'email', label: 'Email', description: 'Email templates and activity' },
  { key: 'payments', label: 'Payments', description: 'Payment tracking and reminders' },
  { key: 'reports', label: 'Reports', description: 'Reports and analytics' },
  { key: 'api', label: 'API Access', description: 'External API integrations' },
];

function FeatureSwitch({ label, description, enabled, onChange, highlight }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 rounded-xl border p-4',
        highlight ? 'border-emerald-300/60 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20' : 'border-[var(--border)]',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
          enabled ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

export default function CompanyFeaturesPanel({ company, onUpdated }) {
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState('');

  const features = { ...(company?.features || {}), ...draft };

  useEffect(() => {
    setDraft({});
  }, [company?.id]);

  const saveMutation = useMutation({
    mutationFn: () => superAdminApi.updateCompany(company.id, { features }),
    onSuccess: () => {
      setDraft({});
      setMessage('Features saved. Changes apply immediately in the company CRM.');
      onUpdated?.();
      setTimeout(() => setMessage(''), 4000);
    },
  });

  function setFlag(key, val) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  const hasChanges = Object.keys(draft).length > 0;

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          Company module access
        </CardTitle>
        <CardDescription>
          Turn WhatsApp API on for this company only. Other companies without WhatsApp will see an upgrade prompt in their CRM.
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {FEATURE_TOGGLES.map((f) => (
          <FeatureSwitch
            key={f.key}
            label={f.label}
            description={f.description}
            highlight={f.highlight}
            enabled={features[f.key] !== false}
            onChange={(v) => setFlag(f.key, v)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => saveMutation.mutate()} disabled={!hasChanges || saveMutation.isPending}>
          <Save className="h-4 w-4" />
          Save features
        </Button>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
      </div>
    </Card>
  );
}
