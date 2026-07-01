import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  Plane,
  Rocket,
  ShieldCheck,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import API from '../../api/axios';
import { APP_BRAND_NAME, APP_PLATFORM_DOMAIN } from '../../config/branding';
import { authStorage } from '../../auth/authStorage';
import { cn } from '../../lib/utils';
import loginBg from '../../assets/login-bg.jpg';
import {
  BUSINESS_TYPES,
  COUNTRIES,
  CURRENCIES,
  INITIAL_SIGNUP_FORM,
  PROVISION_ITEMS,
  SIGNUP_STEPS,
  TIMEZONES,
  slugifySubdomain,
} from './signupConstants';

function StepIndicator({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-1">
        {SIGNUP_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all',
                  done && 'bg-violet-600 text-white shadow-lg shadow-violet-500/30',
                  active && !done && 'bg-violet-600 text-white ring-4 ring-violet-200',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p className={cn('mt-2 hidden text-[10px] font-semibold sm:block', active ? 'text-violet-700' : 'text-slate-400')}>
                {s.title}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
          animate={{ width: `${((step + 1) / SIGNUP_STEPS.length) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">
        Step {step + 1} of {SIGNUP_STEPS.length} — <span className="font-medium text-slate-700">{SIGNUP_STEPS[step].subtitle}</span>
      </p>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20';

export default function SignupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_SIGNUP_FORM);
  const [plans, setPlans] = useState([]);
  const [dnsInfo, setDnsInfo] = useState(null);
  const [subdomainStatus, setSubdomainStatus] = useState({ checking: false, available: null, reason: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = useCallback((patch) => setForm((f) => ({ ...f, ...patch })), []);

  const subdomainPreview = useMemo(() => {
    const sub = slugifySubdomain(form.subdomain || form.companyName) || 'your-company';
    return `${sub}.${APP_PLATFORM_DOMAIN}`;
  }, [form.subdomain, form.companyName]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.slug === form.planSlug) || { name: 'Starter', slug: 'starter' },
    [plans, form.planSlug],
  );

  useEffect(() => {
    API.get('/public/plans', { skipSuccessToast: true, skipErrorToast: true })
      .then((r) => setPlans(r.data?.data || []))
      .catch(() => {});
    API.get('/public/domain/dns-info', { skipSuccessToast: true, skipErrorToast: true })
      .then((r) => setDnsInfo(r.data?.data || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.domainType !== 'subdomain') return;
    const sub = slugifySubdomain(form.subdomain || form.companyName);
    if (!sub || sub.length < 2) {
      setSubdomainStatus({ checking: false, available: null, reason: '' });
      return;
    }
    const timer = setTimeout(async () => {
      setSubdomainStatus((s) => ({ ...s, checking: true }));
      try {
        const res = await API.get(`/public/subdomain/${encodeURIComponent(sub)}/check`, {
          skipSuccessToast: true,
          skipErrorToast: true,
        });
        const data = res.data?.data || {};
        setSubdomainStatus({
          checking: false,
          available: data.available,
          reason: data.reason || '',
        });
      } catch {
        setSubdomainStatus({ checking: false, available: null, reason: '' });
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [form.subdomain, form.companyName, form.domainType]);

  const canProceed = () => {
    if (step === 0) {
      return (
        form.companyName.trim().length >= 2
        && form.ownerName.trim().length >= 2
        && form.ownerEmail.includes('@')
        && form.phone.trim().length >= 6
        && form.password.length >= 8
        && form.password === form.confirmPassword
      );
    }
    if (step === 1) {
      return form.businessType && form.country && form.timezone && form.currency;
    }
    if (step === 2) {
      if (form.domainType === 'subdomain') {
        const sub = slugifySubdomain(form.subdomain || form.companyName);
        return sub.length >= 2 && subdomainStatus.available === true;
      }
      return form.customDomain.includes('.') && form.customDomain.length >= 4;
    }
    if (step === 3) return true;
    return true;
  };

  async function verifyCustomDomain() {
    setError('');
    update({ domainVerifyStatus: 'checking' });
    try {
      const res = await API.post(
        '/public/domain/verify',
        { domain: form.customDomain },
        { skipSuccessToast: true, skipErrorToast: true },
      );
      const data = res.data?.data || {};
      update({
        domainVerified: Boolean(data.verified),
        domainVerifyStatus: data.status === 'verified' ? 'verified' : 'pending',
      });
    } catch (err) {
      update({ domainVerified: false, domainVerifyStatus: 'pending' });
      setError(err.response?.data?.message || 'Could not verify domain');
    }
  }

  async function handleCreate() {
    setError('');
    setLoading(true);
    try {
      const payload = {
        companyName: form.companyName.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
        password: form.password,
        phone: form.phone.trim(),
        planSlug: form.planSlug,
        country: form.country,
        businessType: form.businessType,
        timezone: form.timezone,
        currency: form.currency,
        domainType: form.domainType,
        subdomain: slugifySubdomain(form.subdomain || form.companyName),
        primaryDomain: form.domainType === 'custom' ? form.customDomain.trim() : undefined,
        domainVerified: form.domainType === 'custom' ? form.domainVerified : true,
      };
      const res = await API.post('/public/signup', payload, { skipSuccessToast: true });
      const data = res.data;
      authStorage.saveSession(data, data.token, { sessionExpiresAt: data.sessionExpiresAt });
      setDone(true);
      setTimeout(() => navigate(data.dashboardPath || '/admin/dashboard'), 2200);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Your workspace is ready</h1>
          <p className="mt-2 text-sm text-slate-500">
            Company, Head Office branch, admin user, roles and settings have been created.
          </p>
          <p className="mt-4 text-xs text-violet-600">Redirecting to your dashboard…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-[42%] overflow-hidden lg:block">
        <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <div>
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
                <Plane className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white drop-shadow-md">{APP_BRAND_NAME}</p>
                <p className="text-xs text-white/80">Start your 14-day free demo</p>
              </div>
            </div>
            <h1 className="mt-10 max-w-md text-3xl font-extrabold leading-tight text-white drop-shadow-lg xl:text-4xl">
              Launch your travel business on enterprise-grade infrastructure
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/90 drop-shadow">
              Multi-tenant workspace, automated provisioning, and everything you need to manage leads to bookings.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-black/25 p-5 backdrop-blur-sm">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-violet-300" />
              Included in your free demo
            </p>
            <ul className="space-y-2">
              {PROVISION_ITEMS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/90">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right panel — wizard */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-[520px]"
        >
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">{APP_BRAND_NAME}</span>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white px-6 py-8 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:px-8">
            <div className="mb-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Create your workspace</h2>
              <p className="mt-1 text-sm text-slate-500">No credit card · 14-day trial · Setup in minutes</p>
            </div>

            <StepIndicator step={step} />

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Step 1 — Account */}
                {step === 0 && (
                  <>
                    <Field label="Company Name">
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className={cn(inputClass, 'pl-10')} value={form.companyName} onChange={(e) => update({ companyName: e.target.value })} placeholder="Acme Travel Pvt Ltd" />
                      </div>
                    </Field>
                    <Field label="Owner Name">
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className={cn(inputClass, 'pl-10')} value={form.ownerName} onChange={(e) => update({ ownerName: e.target.value })} placeholder="Your full name" />
                      </div>
                    </Field>
                    <Field label="Email">
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input type="email" className={cn(inputClass, 'pl-10')} value={form.ownerEmail} onChange={(e) => update({ ownerEmail: e.target.value })} placeholder="you@company.com" />
                      </div>
                    </Field>
                    <Field label="Phone">
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className={cn(inputClass, 'pl-10')} value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+91 98765 43210" />
                      </div>
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Password">
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="password" className={cn(inputClass, 'pl-10')} value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder="Min. 8 characters" />
                        </div>
                      </Field>
                      <Field label="Confirm Password">
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="password" className={cn(inputClass, 'pl-10')} value={form.confirmPassword} onChange={(e) => update({ confirmPassword: e.target.value })} placeholder="Repeat password" />
                        </div>
                      </Field>
                    </div>
                  </>
                )}

                {/* Step 2 — Business */}
                {step === 1 && (
                  <>
                    <Field label="Business Type">
                      <select className={inputClass} value={form.businessType} onChange={(e) => update({ businessType: e.target.value })}>
                        {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Country">
                      <select className={inputClass} value={form.country} onChange={(e) => update({ country: e.target.value })}>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Timezone">
                      <select className={inputClass} value={form.timezone} onChange={(e) => update({ timezone: e.target.value })}>
                        {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Currency">
                      <select className={inputClass} value={form.currency} onChange={(e) => update({ currency: e.target.value })}>
                        {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Plan">
                      <select className={inputClass} value={form.planSlug} onChange={(e) => update({ planSlug: e.target.value })}>
                        {(plans.length ? plans : [{ slug: 'starter', name: 'Starter (Trial)' }]).map((p) => (
                          <option key={p.slug} value={p.slug}>{p.name}</option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}

                {/* Step 3 — Domain */}
                {step === 2 && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => update({ domainType: 'subdomain', domainVerified: true, domainVerifyStatus: 'idle' })}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all',
                          form.domainType === 'subdomain'
                            ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-400/20'
                            : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <Globe className="mb-2 h-5 w-5 text-violet-600" />
                        <p className="font-semibold text-slate-900">Free Subdomain</p>
                        <p className="mt-1 text-xs text-slate-500">Instant setup</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ domainType: 'custom', domainVerified: false, domainVerifyStatus: 'idle' })}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition-all',
                          form.domainType === 'custom'
                            ? 'border-violet-400 bg-violet-50 ring-2 ring-violet-400/20'
                            : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <ShieldCheck className="mb-2 h-5 w-5 text-violet-600" />
                        <p className="font-semibold text-slate-900">Custom Domain</p>
                        <p className="mt-1 text-xs text-slate-500">crm.yourcompany.com</p>
                      </button>
                    </div>

                    {form.domainType === 'subdomain' ? (
                      <Field label="Choose your subdomain" hint={`Your workspace: ${subdomainPreview}`}>
                        <input
                          className={inputClass}
                          value={form.subdomain}
                          onChange={(e) => update({ subdomain: e.target.value })}
                          placeholder={slugifySubdomain(form.companyName) || 'acme'}
                        />
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {subdomainStatus.checking && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                          {!subdomainStatus.checking && subdomainStatus.available === true && (
                            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Available</span>
                          )}
                          {!subdomainStatus.checking && subdomainStatus.available === false && (
                            <span className="flex items-center gap-1 text-rose-600"><XCircle className="h-3.5 w-3.5" /> {subdomainStatus.reason || 'Unavailable'}</span>
                          )}
                        </div>
                      </Field>
                    ) : (
                      <>
                        <Field label="Custom domain" hint="Example: crm.yourcompany.com">
                          <input
                            className={inputClass}
                            value={form.customDomain}
                            onChange={(e) => update({ customDomain: e.target.value, domainVerified: false, domainVerifyStatus: 'idle' })}
                            placeholder="crm.yourcompany.com"
                          />
                        </Field>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                          <p className="mb-3 font-semibold text-slate-800">DNS Instructions</p>
                          <div className="space-y-3 font-mono text-xs text-slate-600">
                            <div className="rounded-lg bg-white p-3 border border-slate-200">
                              <p className="text-slate-400 mb-1">CNAME Record</p>
                              <p><span className="text-violet-600">crm</span> → <span className="text-violet-600">{dnsInfo?.cnameTarget || `app.${APP_PLATFORM_DOMAIN}`}</span></p>
                            </div>
                            {dnsInfo?.serverIp && (
                              <div className="rounded-lg bg-white p-3 border border-slate-200">
                                <p className="text-slate-400 mb-1">OR A Record</p>
                                <p><span className="text-violet-600">crm</span> → <span className="text-violet-600">{dnsInfo.serverIp}</span></p>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={verifyCustomDomain}
                            disabled={form.domainVerifyStatus === 'checking' || !form.customDomain.includes('.')}
                            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                          >
                            {form.domainVerifyStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Verify DNS
                          </button>
                          {form.domainVerifyStatus === 'verified' && (
                            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" /> Verified
                            </p>
                          )}
                          {form.domainVerifyStatus === 'pending' && (
                            <p className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-600">
                              <Clock className="h-4 w-4" /> Pending Verification — you can continue and verify later
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Step 4 — Review */}
                {step === 3 && (
                  <div className="space-y-3">
                    {[
                      { label: 'Company', value: form.companyName },
                      { label: 'Owner', value: `${form.ownerName} · ${form.ownerEmail}` },
                      { label: 'Business', value: `${form.businessType} · ${form.country}` },
                      { label: 'Regional', value: `${form.timezone} · ${form.currency}` },
                      { label: 'Plan', value: selectedPlan.name },
                      {
                        label: 'Domain',
                        value: form.domainType === 'subdomain'
                          ? subdomainPreview
                          : `${form.customDomain} (${form.domainVerified ? 'Verified' : 'Pending'})`,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-right font-medium text-slate-800">{row.value}</span>
                      </div>
                    ))}
                    <p className="text-xs text-slate-400 pt-1">
                      Head Office branch will be created automatically — no branch setup required.
                    </p>
                  </div>
                )}

                {/* Step 5 — Launch */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Rocket className="h-4 w-4" />
                        Ready to launch your free demo
                      </p>
                      <p className="mt-2 text-sm text-white/85">
                        We&apos;ll automatically provision your entire workspace in seconds.
                      </p>
                    </div>
                    <ul className="space-y-2.5">
                      {PROVISION_ITEMS.map((item) => (
                        <li key={item} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm text-slate-700">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {step < SIGNUP_STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canProceed()}
                  onClick={() => setStep(step + 1)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreate}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {loading ? 'Creating…' : 'Create Free Demo'}
                </button>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-violet-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
