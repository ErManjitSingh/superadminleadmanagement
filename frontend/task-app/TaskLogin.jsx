import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { useTenantBranding } from '../src/context/TenantContext';

export default function TaskLogin() {
  const { user, login } = useAuth();
  const { appTitle, logo } = useTenantBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `Sign in | WorkFlow Hub`;
  }, []);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Enter your email address and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(normalizedEmail, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError?.message || 'Unable to sign in. Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-surface-app lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#0d3b2a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -bottom-44 -left-24 h-96 w-96 rounded-full border border-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-emerald-800">W</div>
          <div>
            <p className="text-lg font-bold">WorkFlow Hub</p>
            <p className="text-xs text-emerald-100/70">{appTitle || 'India Holiday Destination'}</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">One place for every project</p>
          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight">Plan clearly. Work together. Deliver better.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-emerald-50/75">
            A secure workspace for website, software, SEO, marketing and business projects.
          </p>
          <div className="mt-9 flex items-center gap-3 text-sm text-emerald-50/80">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            Your existing company account and permissions are used securely.
          </div>
        </div>

        <p className="relative z-10 text-xs text-emerald-100/50">WorkFlow Hub · Company workspace</p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            {logo ? (
              <img src={logo} alt="" className="h-10 w-10 rounded-xl object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 font-black text-white">W</div>
            )}
            <div>
              <p className="font-bold text-content-primary">WorkFlow Hub</p>
              <p className="text-xs text-content-tertiary">{appTitle || 'Company workspace'}</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-emerald-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-content-primary">Sign in to your workspace</h2>
          <p className="mt-3 text-sm leading-6 text-content-secondary">Use the same account you use for the company CRM.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-content-primary">Email address</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-subtle bg-surface pl-10 pr-4 text-sm text-content-primary outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  placeholder="name@company.com"
                  disabled={loading}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-content-primary">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-xl border border-subtle bg-surface pl-10 pr-11 text-sm text-content-primary outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-content-tertiary hover:text-content-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
