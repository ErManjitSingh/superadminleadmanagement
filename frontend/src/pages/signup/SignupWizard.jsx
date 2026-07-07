import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plane,
  Rocket,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import API from '../../api/axios';
import { APP_BRAND_NAME, APP_PLATFORM_DOMAIN } from '../../config/branding';
import { authStorage } from '../../auth/authStorage';
import { setTenantSubdomain } from '../../lib/tenantContext';
import { cn } from '../../lib/utils';
import { toast } from '../../context/ToastContext';
import loginBg from '../../assets/login-bg.jpg';
import {
  BUSINESS_TYPES,
  COUNTRIES,
  CURRENCIES,
  INITIAL_SIGNUP_FORM,
  PROVISION_ITEMS,
  SIGNUP_BENEFITS,
  SIGNUP_STEPS,
  TIMEZONES,
  TRUST_BADGES,
  copyToClipboard,
  slugifySubdomain,
} from './signupConstants';

const STEP_ICONS = {
  account: User,
  business: Building2,
  plan: CreditCard,
  domain: Globe,
  review: CheckCircle2,
  launch: Rocket,
};

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

function StepIndicator({ step }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-0.5">
        {SIGNUP_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const Icon = STEP_ICONS[s.id] || User;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-9 sm:w-9',
                  done && 'bg-violet-600 text-white shadow-md shadow-violet-500/30',
                  active && !done && 'bg-violet-600 text-white ring-4 ring-violet-100',
                  !done && !active && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </div>
              <p className={cn('mt-1.5 hidden text-[9px] font-semibold leading-tight sm:block lg:text-[10px]', active ? 'text-violet-700' : 'text-slate-400')}>
                {s.title}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600"
          animate={{ width: `${((step + 1) / SIGNUP_STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function StepHeader({ step }) {
  const meta = SIGNUP_STEPS[step];
  const Icon = STEP_ICONS[meta.id] || Sparkles;
  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
          Step {step + 1} of {SIGNUP_STEPS.length}
        </p>
        <h3 className="text-base font-bold text-slate-900">{meta.title}</h3>
        <p className="text-xs text-slate-500">{meta.subtitle}</p>
      </div>
    </div>
  );
}

function Field({ label, children, hint, required }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function CopyRow({ label, host, value }) {
  const full = `${host} → ${value}`;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex items-center justify-between gap-2 font-mono text-xs">
        <p className="min-w-0 truncate text-slate-700">
          <span className="font-semibold text-violet-600">{host}</span>
          <span className="text-slate-400"> → </span>
          <span className="text-violet-700">{value}</span>
        </p>
        <button
          type="button"
          onClick={() => copyToClipboard(value).then(() => toast.success('Copied to clipboard'))}
          className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-violet-50 hover:text-violet-600"
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

const inputClass =
  'h-12 w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20';

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
  const [createdWorkspace, setCreatedWorkspace] = useState('');
  const [signupResult, setSignupResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = useCallback((patch) => setForm((f) => ({ ...f, ...patch })), []);

  const subdomainPreview = useMemo(() => {
    const sub = slugifySubdomain(form.subdomain || form.companyName) || 'your-company';
    return `${sub}.${APP_PLATFORM_DOMAIN}`;
  }, [form.subdomain, form.companyName]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.slug === form.planSlug) || { name: 'Starter', slug: 'starter', description: 'Perfect to get started' },
    [plans, form.planSlug],
  );

  const pwStrength = passwordStrength(form.password);

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
        setSubdomainStatus({ checking: false, available: data.available, reason: data.reason || '' });
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
    if (step === 1) return form.businessType && form.country && form.timezone && form.currency;
    if (step === 2) return Boolean(form.planSlug);
    if (step === 3) {
      if (form.domainType === 'subdomain') {
        const sub = slugifySubdomain(form.subdomain || form.companyName);
        return sub.length >= 2 && subdomainStatus.available === true;
      }
      return form.customDomain.includes('.') && form.customDomain.length >= 4;
    }
    if (step === 4) return true;
    return true;
  };

  async function verifyCustomDomain() {
    setError('');
    update({ domainVerifyStatus: 'checking' });
    try {
      const res = await API.post('/public/domain/verify', { domain: form.customDomain }, { skipSuccessToast: true, skipErrorToast: true });
      const data = res.data?.data || {};
      update({
        domainVerified: Boolean(data.verified),
        domainVerifyStatus: data.status === 'verified' ? 'verified' : 'pending',
      });
      if (data.verified) toast.success('DNS verified successfully');
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
      if (data.company?.subdomain) setTenantSubdomain(data.company.subdomain);
      setCreatedWorkspace(data.company?.workspaceUrl || `https://${subdomainPreview}/app`);
      setSignupResult(data);
      setDone(true);

      const redirectAfter = () => {
        if (data.requiresDnsSetup) {
          navigate('/setup-dns');
          return;
        }
        if (data.requiresEmailVerification) {
          navigate('/verify-email');
          return;
        }
        const workspaceUrl = data.company?.workspaceUrl;
        if (workspaceUrl) {
          try {
            const target = new URL(workspaceUrl);
            if (window.location.hostname !== target.hostname) {
              window.location.href = `${workspaceUrl}/login`;
              return;
            }
          } catch { /* stay */ }
        }
        navigate(data.dashboardPath || '/admin/dashboard');
      };

      setTimeout(redirectAfter, data.requiresDnsSetup ? 1200 : 2800);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const needsDns = signupResult?.requiresDnsSetup;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-10 text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900">Workspace Created!</h1>
          <p className="mt-2 text-sm text-slate-500">
            {needsDns
              ? 'One more step — update your DNS records to activate your custom domain.'
              : 'Your company, Head Office branch, admin account and all defaults are ready.'}
          </p>
          {createdWorkspace && (
            <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3">
              <p className="text-xs font-medium text-violet-600">Your workspace URL</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-800">{createdWorkspace}</p>
            </div>
          )}
          {needsDns && signupResult?.dnsSetup?.domain && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              <p className="font-semibold">DNS update required</p>
              <p className="mt-1 text-xs text-amber-800">
                Add CNAME: <span className="font-mono">{signupResult.dnsSetup.dnsHost}</span> →{' '}
                <span className="font-mono">{signupResult.dnsSetup.cnameTarget}</span>
              </p>
            </div>
          )}
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-violet-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {needsDns ? 'Opening DNS setup…' : 'Redirecting…'}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — matches login */}
      <div className="relative hidden w-[46%] overflow-hidden lg:flex lg:flex-col">
        <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-violet-950/55 to-indigo-900/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <div>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="mt-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{APP_BRAND_NAME}</p>
                <p className="text-xs text-white/60">Start your 7-day free trial</p>
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl"
            >
              Build your travel empire on one platform
            </motion.h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              From leads to bookings — get a fully provisioned CRM workspace in under 2 minutes.
            </p>

            <ul className="mt-8 space-y-3">
              {SIGNUP_BENEFITS.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-center gap-3 text-sm text-white/85"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    <Zap className="h-3.5 w-3.5 text-violet-300" />
                  </span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-violet-300" />
                Auto-provisioned on launch
              </p>
              <ul className="grid grid-cols-2 gap-2">
                {PROVISION_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-white/80">
                    <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRUST_BADGES.map((b) => (
                <span key={b} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — wizard */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-[540px]"
        >
          <div className="mb-5 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg">
              <Plane className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-800">{APP_BRAND_NAME}</span>
              <p className="text-[10px] text-slate-500">7-day free trial</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white px-5 py-7 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Create your workspace</h2>
              <p className="mt-1 text-sm text-slate-500">No credit card required · Setup in 2 minutes</p>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                <StepHeader step={step} />

                <div className="space-y-4">
                  {step === 0 && (
                    <>
                      <Field label="Company Name" required>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input className={cn(inputClass, 'pl-10')} value={form.companyName} onChange={(e) => update({ companyName: e.target.value })} placeholder="Acme Travel Pvt Ltd" />
                        </div>
                      </Field>
                      <Field label="Owner Name" required>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input className={cn(inputClass, 'pl-10')} value={form.ownerName} onChange={(e) => update({ ownerName: e.target.value })} placeholder="Your full name" />
                        </div>
                      </Field>
                      <Field label="Business Email" required>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input type="email" className={cn(inputClass, 'pl-10')} value={form.ownerEmail} onChange={(e) => update({ ownerEmail: e.target.value })} placeholder="you@company.com" />
                        </div>
                      </Field>
                      <Field label="Phone" required>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input className={cn(inputClass, 'pl-10')} value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+91 98765 43210" />
                        </div>
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Password" required>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type={showPassword ? 'text' : 'password'} className={cn(inputClass, 'pl-10 pr-10')} value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder="Min. 8 characters" />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {form.password && (
                            <div className="mt-2">
                              <div className="flex h-1 overflow-hidden rounded-full bg-slate-100">
                                <div className={cn('h-full rounded-full transition-all', pwStrength.color)} style={{ width: `${(pwStrength.score / 5) * 100}%` }} />
                              </div>
                              <p className="mt-1 text-[10px] text-slate-500">{pwStrength.label}</p>
                            </div>
                          )}
                        </Field>
                        <Field label="Confirm Password" required>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input type={showConfirm ? 'text' : 'password'} className={cn(inputClass, 'pl-10 pr-10')} value={form.confirmPassword} onChange={(e) => update({ confirmPassword: e.target.value })} placeholder="Repeat password" />
                            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {form.confirmPassword && form.password !== form.confirmPassword && (
                            <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
                          )}
                        </Field>
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <Field label="Business Type" required>
                        <select className={cn(inputClass, 'px-4')} value={form.businessType} onChange={(e) => update({ businessType: e.target.value })}>
                          {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Country" required>
                          <div className="relative">
                            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select className={cn(inputClass, 'pl-10')} value={form.country} onChange={(e) => update({ country: e.target.value })}>
                              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </Field>
                        <Field label="Currency" required>
                          <select className={cn(inputClass, 'px-4')} value={form.currency} onChange={(e) => update({ currency: e.target.value })}>
                            {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </Field>
                      </div>
                      <Field label="Timezone" required>
                        <select className={cn(inputClass, 'px-4')} value={form.timezone} onChange={(e) => update({ timezone: e.target.value })}>
                          {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </Field>
                    </>
                  )}

                  {step === 2 && (
                    <div className="space-y-3">
                      {(plans.length ? plans : [{ slug: 'starter', name: 'Starter', description: 'Perfect for small agencies', monthlyPrice: 2999, userLimit: 5 }]).map((p) => {
                        const selected = form.planSlug === p.slug;
                        const isTrial = p.slug === 'starter';
                        return (
                          <button
                            key={p.slug}
                            type="button"
                            onClick={() => update({ planSlug: p.slug })}
                            className={cn(
                              'relative w-full rounded-2xl border p-4 text-left transition-all',
                              selected
                                ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-indigo-50 ring-2 ring-violet-400/30 shadow-md'
                                : 'border-slate-200 hover:border-violet-200 hover:shadow-sm',
                            )}
                          >
                            {isTrial && (
                              <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                7-day trial
                              </span>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">{p.description || 'Full CRM access'}</p>
                                {p.userLimit && (
                                  <p className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                                    <Users className="h-3 w-3" /> Up to {p.userLimit} users
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                {p.monthlyPrice > 0 ? (
                                  <>
                                    <p className="text-lg font-bold text-violet-700">₹{p.monthlyPrice.toLocaleString('en-IN')}</p>
                                    <p className="text-[10px] text-slate-400">/month</p>
                                  </>
                                ) : (
                                  <p className="text-sm font-bold text-emerald-600">Free trial</p>
                                )}
                                {selected && <CheckCircle2 className="ml-auto mt-1 h-5 w-5 text-violet-600" />}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {step === 3 && (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { type: 'subdomain', icon: Globe, title: 'Free Subdomain', desc: 'Instant — no DNS needed', badge: 'Recommended' },
                          { type: 'custom', icon: ShieldCheck, title: 'Custom Domain', desc: 'crm.yourcompany.com', badge: null },
                        ].map(({ type, icon: Icon, title, desc, badge }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => update({
                              domainType: type,
                              domainVerified: type === 'subdomain',
                              domainVerifyStatus: 'idle',
                            })}
                            className={cn(
                              'relative rounded-2xl border p-4 text-left transition-all',
                              form.domainType === type
                                ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-400/20'
                                : 'border-slate-200 hover:border-slate-300',
                            )}
                          >
                            {badge && (
                              <span className="absolute -top-2 left-3 rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-bold text-white">{badge}</span>
                            )}
                            <Icon className="mb-2 h-5 w-5 text-violet-600" />
                            <p className="font-semibold text-slate-900">{title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                          </button>
                        ))}
                      </div>

                      {form.domainType === 'subdomain' ? (
                        <Field label="Workspace subdomain" hint="Only lowercase letters, numbers and hyphens">
                          <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20">
                            <input
                              className="h-12 min-w-0 flex-1 border-0 bg-white px-4 text-sm outline-none"
                              value={form.subdomain}
                              onChange={(e) => update({ subdomain: e.target.value })}
                              placeholder={slugifySubdomain(form.companyName) || 'acme'}
                            />
                            <span className="flex h-12 items-center border-l border-slate-200 bg-slate-50 px-3 text-xs text-slate-500">
                              .{APP_PLATFORM_DOMAIN}
                            </span>
                          </div>
                          <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
                            <p className="text-[10px] font-semibold uppercase text-violet-600">Preview</p>
                            <p className="mt-0.5 font-mono text-sm font-medium text-slate-800">https://{subdomainPreview}/app</p>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            {subdomainStatus.checking && <><Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" /><span className="text-slate-500">Checking availability…</span></>}
                            {!subdomainStatus.checking && subdomainStatus.available === true && (
                              <span className="flex items-center gap-1 font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Available</span>
                            )}
                            {!subdomainStatus.checking && subdomainStatus.available === false && (
                              <span className="flex items-center gap-1 font-medium text-rose-600"><XCircle className="h-3.5 w-3.5" /> {subdomainStatus.reason || 'Unavailable'}</span>
                            )}
                          </div>
                        </Field>
                      ) : (
                        <>
                          <Field label="Custom domain" hint="e.g. crm.yourcompany.com or portal.travel.in">
                            <input className={cn(inputClass, 'px-4 font-mono text-sm')} value={form.customDomain} onChange={(e) => update({ customDomain: e.target.value, domainVerified: false, domainVerifyStatus: 'idle' })} placeholder="crm.yourcompany.com" />
                          </Field>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                              <Globe className="h-4 w-4 text-violet-600" />
                              DNS Setup
                            </p>
                            <div className="space-y-2">
                              <CopyRow label="CNAME Record" host="crm" value={dnsInfo?.cnameTarget || `app.${APP_PLATFORM_DOMAIN}`} />
                              {dnsInfo?.serverIp && (
                                <CopyRow label="A Record (alternative)" host="crm" value={dnsInfo.serverIp} />
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={verifyCustomDomain}
                              disabled={form.domainVerifyStatus === 'checking' || !form.customDomain.includes('.')}
                              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-md hover:bg-violet-500 disabled:opacity-50"
                            >
                              {form.domainVerifyStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                              Verify DNS
                            </button>
                            {form.domainVerifyStatus === 'verified' && (
                              <p className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" /> DNS Verified — SSL will be provisioned
                              </p>
                            )}
                            {form.domainVerifyStatus === 'pending' && form.customDomain.includes('.') && (
                              <p className="mt-3 flex items-center justify-center gap-2 text-sm text-amber-700">
                                <Clock className="h-4 w-4" /> Pending — you can continue and verify later
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {step === 4 && (
                    <div className="space-y-2">
                      {[
                        { label: 'Company', value: form.companyName, icon: Building2 },
                        { label: 'Owner', value: `${form.ownerName} · ${form.ownerEmail}`, icon: User },
                        { label: 'Business', value: `${form.businessType} · ${form.country}`, icon: BarChart3 },
                        { label: 'Regional', value: `${form.timezone} · ${form.currency}`, icon: MapPin },
                        { label: 'Plan', value: selectedPlan.name, icon: CreditCard },
                        { label: 'Workspace URL', value: form.domainType === 'subdomain' ? `https://${subdomainPreview}/app` : form.customDomain, icon: Globe },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                            <p className="truncate text-sm font-medium text-slate-800">{value}</p>
                          </div>
                        </div>
                      ))}
                      <p className="pt-2 text-center text-xs text-slate-400">
                        <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
                        Head Office branch & admin user created automatically
                      </p>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 p-5 text-white shadow-lg shadow-violet-500/25">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Rocket className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold">Ready to launch</p>
                            <p className="text-sm text-white/80">{form.companyName || 'Your company'} · {selectedPlan.name} plan</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-white/75">
                          We&apos;ll provision your entire workspace — company, branch, admin, roles, templates and settings — in seconds.
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {PROVISION_ITEMS.map((item, i) => (
                          <motion.li
                            key={item}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-7 flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => { setError(''); setStep(step - 1); }}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              {step < SIGNUP_STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canProceed()}
                  onClick={() => { setError(''); setStep(step + 1); }}
                  className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreate}
                  className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
                  {loading ? 'Provisioning workspace…' : 'Launch My Workspace'}
                </button>
              )}
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              Secure & encrypted · By signing up you agree to our terms
            </p>

            <p className="mt-3 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-violet-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
