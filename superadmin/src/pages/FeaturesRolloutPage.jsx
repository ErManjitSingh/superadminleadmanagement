import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Rocket, Save, Users, Building2 } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

function FeatureToggle({ label, description, enabled, onChange, stats }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium capitalize">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>}
        {stats && (
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            <span className="text-emerald-600">{stats.enabled} on</span>
            {' · '}
            <span className="text-slate-500">{stats.disabled} off</span>
            {' · '}
            {stats.total} companies
          </p>
        )}
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

export default function FeaturesRolloutPage() {
  const queryClient = useQueryClient();
  const [rolloutDraft, setRolloutDraft] = useState({});
  const [defaultsDraft, setDefaultsDraft] = useState(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [companySearch, setCompanySearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['platform-features'],
    queryFn: () => superAdminApi.getPlatformFeatures().then((r) => r.data.data),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies-rollout', companySearch],
    queryFn: () => superAdminApi.listCompanies({ search: companySearch, limit: 50 }).then((r) => r.data),
  });

  const saveDefaultsMutation = useMutation({
    mutationFn: (features) => superAdminApi.savePlatformFeatureDefaults({ features }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-features'] });
      setDefaultsDraft(null);
    },
  });

  const rolloutMutation = useMutation({
    mutationFn: (payload) => superAdminApi.rolloutPlatformFeatures(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['platform-features'] });
      setRolloutDraft({});
      alert(res.data.message || 'Rollout complete');
    },
  });

  const features = data?.features || [];
  const defaults = defaultsDraft ?? data?.defaults ?? {};
  const stats = data?.stats?.byFeature || {};
  const companies = companiesData?.data || [];

  const rolloutChanges = useMemo(
    () => Object.entries(rolloutDraft).filter(([, v]) => typeof v === 'boolean'),
    [rolloutDraft],
  );

  function setDefaultFlag(key, val) {
    setDefaultsDraft((prev) => ({ ...(prev ?? data?.defaults ?? {}), [key]: val }));
  }

  function setRolloutFlag(key, val) {
    setRolloutDraft((prev) => ({ ...prev, [key]: val }));
  }

  function toggleCompany(id) {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function confirmRollout(scope) {
    if (!rolloutChanges.length) {
      alert('Toggle at least one module in the rollout section first.');
      return;
    }
    const featuresPatch = Object.fromEntries(rolloutChanges);
    const label = scope === 'all'
      ? `ALL ${data?.stats?.totalCompanies ?? 0} companies`
      : `${selectedCompanyIds.length} selected companies`;
    if (!window.confirm(`Push feature changes to ${label}?\n\n${rolloutChanges.map(([k, v]) => `${k}: ${v ? 'ON' : 'OFF'}`).join('\n')}`)) {
      return;
    }
    rolloutMutation.mutate({
      features: featuresPatch,
      scope,
      companyIds: scope === 'selected' ? selectedCompanyIds : undefined,
    });
  }

  if (isLoading) return <div className="py-20 text-center">Loading features…</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Features"
        description="Control which CRM modules are enabled. Save defaults for new companies, or push changes to existing tenants."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Defaults for new companies */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Save className="h-5 w-5 text-violet-600" />
              New company defaults
            </CardTitle>
            <CardDescription>
              Applied when Super Admin or signup creates a new company.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {features.map((f) => (
              <FeatureToggle
                key={`def-${f.key}`}
                label={f.label}
                enabled={defaults[f.key] !== false}
                onChange={(v) => setDefaultFlag(f.key, v)}
                stats={stats[f.key]}
              />
            ))}
          </div>
          <Button
            className="mt-4"
            onClick={() => saveDefaultsMutation.mutate(defaults)}
            disabled={!defaultsDraft || saveDefaultsMutation.isPending}
          >
            Save defaults
          </Button>
        </Card>

        {/* Rollout to existing */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-violet-600" />
              Push to existing companies
            </CardTitle>
            <CardDescription>
              Toggle modules below, then push ON/OFF to all tenants or selected companies.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {features.map((f) => {
              const rolloutVal = rolloutDraft[f.key];
              const displayEnabled = typeof rolloutVal === 'boolean' ? rolloutVal : defaults[f.key] !== false;
              return (
                <FeatureToggle
                  key={`roll-${f.key}`}
                  label={f.label}
                  enabled={displayEnabled}
                  onChange={(v) => setRolloutFlag(f.key, v)}
                />
              );
            })}
          </div>

          {rolloutChanges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {rolloutChanges.map(([k, v]) => (
                <Badge key={k} variant={v ? 'default' : 'secondary'}>
                  {k}: {v ? 'ON' : 'OFF'}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() => confirmRollout('all')}
              disabled={rolloutMutation.isPending || !rolloutChanges.length}
            >
              <Building2 className="h-4 w-4" />
              Push to all companies
            </Button>
            <Button
              variant="secondary"
              onClick={() => confirmRollout('selected')}
              disabled={rolloutMutation.isPending || !rolloutChanges.length || !selectedCompanyIds.length}
            >
              <Users className="h-4 w-4" />
              Push to selected ({selectedCompanyIds.length})
            </Button>
          </div>
        </Card>
      </div>

      {/* Company picker for selective rollout */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg">Select companies (optional)</CardTitle>
          <CardDescription>Pick specific tenants for selective rollout.</CardDescription>
        </CardHeader>
        <input
          type="search"
          placeholder="Search companies…"
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
          className="mb-3 w-full max-w-md rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {companies.map((c) => {
            const id = c.id || c._id;
            const checked = selectedCompanyIds.includes(id);
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                  checked ? 'border-violet-400 bg-violet-50' : 'border-transparent hover:bg-slate-50',
                )}
              >
                <input type="checkbox" checked={checked} onChange={() => toggleCompany(id)} />
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{c.subdomain}</span>
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
