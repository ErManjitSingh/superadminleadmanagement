import { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Palette } from 'lucide-react';
import { toast } from '../../context/ToastContext';
import API from '../../api/axios';
import PageHeader from '../../components/ui/PageHeader';
import CustomDomainSetup from '../../components/settings/CustomDomainSetup';
import OnboardingChecklist from '../../components/onboarding/OnboardingChecklist';

export default function CompanyWorkspacePage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState({});

  const load = useCallback(async () => {
    const settingsRes = await API.get('/company-settings', { skipSuccessToast: true });
    const c = settingsRes.data?.company;
    setCompany(c);
    setWhiteLabel(c?.whiteLabel || {});
    setLoading(false);
  }, []);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);

  async function saveBranding(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.patch('/company-settings', { whiteLabel, logo: company?.logo });
      setCompany(res.data.company);
      toast.success('Branding saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function resendVerification() {
    await API.post('/company-settings/resend-verification');
    toast.success('Verification email sent');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Domain"
        description="Connect your own domain or use your system subdomain — both open the same CRM"
        breadcrumbs={['Settings', 'Custom Domain']}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {!company?.ownerEmailVerified && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">Email verification pending</p>
              <p className="mt-1 text-sm text-amber-800">Verify your business email to unlock full workspace access.</p>
              <button type="button" onClick={resendVerification} className="mt-3 text-sm font-semibold text-amber-900 underline">
                Resend verification email
              </button>
            </div>
          )}

          <section className="rounded-2xl border border-subtle bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold text-content-primary">
              <Building2 className="h-5 w-5 text-violet-600" />
              Custom Domain
            </h3>
            <div className="mt-5">
              <CustomDomainSetup company={company} onCompanyChange={setCompany} />
            </div>
          </section>

          <section className="rounded-2xl border border-subtle bg-surface p-6">
            <h3 className="flex items-center gap-2 font-semibold text-content-primary">
              <Palette className="h-5 w-5 text-violet-600" />
              White Label
            </h3>
            <form onSubmit={saveBranding} className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['appTitle', 'App Title', 'text'],
                ['primaryColor', 'Primary Color', 'color'],
                ['secondaryColor', 'Secondary Color', 'color'],
                ['sidebarColor', 'Sidebar Color', 'color'],
                ['emailLogoUrl', 'Email Logo URL', 'text'],
                ['invoiceLogoUrl', 'Invoice Logo URL', 'text'],
                ['quotationLogoUrl', 'Quotation Logo URL', 'text'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                  <input
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    value={whiteLabel[key] || ''}
                    onChange={(e) => setWhiteLabel((w) => ({ ...w, [key]: e.target.value }))}
                    type={type}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
                  {saving ? 'Saving…' : 'Save Branding'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div>
          <OnboardingChecklist />
        </div>
      </div>
    </div>
  );
}
