import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plane,
  Sun,
  Moon,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Target,
  FileText,
  ClipboardList,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTenantBranding } from '../context/TenantContext';
import { AuthError } from '../auth/authService';
import { cn } from '../lib/utils';
import { APP_BRAND_NAME } from '../config/branding';
import loginBg from '../assets/login-bg.jpg';

const LEFT_FEATURES = [
  { icon: Target, label: 'Smart Lead Management' },
  { icon: FileText, label: 'Quotation & Booking Management' },
  { icon: ClipboardList, label: 'Operations & Itinerary Management' },
  { icon: Building2, label: 'Vendor, Hotel & Transport Management' },
  { icon: Users, label: 'Team Collaboration & Attendance' },
  { icon: BarChart3, label: 'Reports, Analytics & Insights' },
];

const TRUST_STATS = [
  { value: '100+', label: 'Companies' },
  { value: '50K+', label: 'Users' },
  { value: '1M+', label: 'Leads Managed' },
  { value: '99.9%', label: 'Uptime' },
];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-5 w-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.89 3.51-.84 1.49.06 2.61.72 3.35 1.78-3.01 1.76-2.52 5.6.47 6.86-.57 1.5-1.31 2.99-2.41 4.37zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, getDashboardPath } = useAuth();
  const { toggleTheme, isDark, setTheme } = useTheme();
  const { appTitle, logo } = useTenantBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const brandName = appTitle || APP_BRAND_NAME;

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  if (user) {
    const dest = user.dashboardPath || getDashboardPath(user.role);
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const sessionUser = await login(email, password);
      const dest = sessionUser.dashboardPath || getDashboardPath(sessionUser.role);
      navigate(location.state?.from || dest, { replace: true });
    } catch (err) {
      const msg =
        err instanceof AuthError
          ? err.message
          : err.response?.data?.message
            || (err.message === 'Network Error'
              ? 'Cannot reach API. Check that the backend is running and your domain is configured correctly.'
              : err.message)
            || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ── */}
      <div className="relative hidden w-[48%] overflow-hidden lg:flex lg:flex-col">
        <img
          src={loginBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-violet-950/55 to-indigo-900/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
                {logo ? (
                  <img src={logo} alt={brandName} className="h-full w-full object-cover" />
                ) : (
                  <Plane className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-white">{brandName}</p>
                <p className="text-xs text-white/60">The Complete Travel Business Management Platform</p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">
                Manage. Automate. Grow Your Travel Business.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
                One powerful CRM to manage leads, quotations, bookings, operations, teams, and everything in between.
              </p>

              <ul className="mt-8 space-y-3.5">
                {LEFT_FEATURES.map(({ icon: Icon, label }, i) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                    className="flex items-center gap-3 text-sm text-white/85"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-violet-200" />
                    </span>
                    {label}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
          >
            <p className="mb-4 text-sm font-semibold text-white">Trusted by Travel Companies Worldwide</p>
            <div className="grid grid-cols-4 gap-3">
              {TRUST_STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-white/55">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />

        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-5 top-5 z-20 flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
          aria-label="Toggle theme"
        >
          <span className={cn('rounded-full p-1.5 transition-colors', !isDark && 'bg-violet-100 text-violet-600')}>
            <Sun className="h-4 w-4" />
          </span>
          <span className={cn('rounded-full p-1.5 transition-colors', isDark && 'bg-violet-100 text-violet-600')}>
            <Moon className="h-4 w-4" />
          </span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              {logo ? (
                <img src={logo} alt={brandName} className="h-full w-full object-cover" />
              ) : (
                <Plane className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="text-lg font-bold text-slate-800">{brandName}</span>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white px-7 py-8 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:px-9 sm:py-10">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30">
                {logo ? (
                  <img src={logo} alt={brandName} className="h-full w-full object-cover" />
                ) : (
                  <Plane className="h-7 w-7 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Welcome Back <span aria-hidden>👋</span>
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to continue to {brandName}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setActivePreset(null); }}
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <button type="button" className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline">
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <GoogleIcon />, label: 'Google' },
                { icon: <MicrosoftIcon />, label: 'Microsoft' },
                { icon: <AppleIcon />, label: 'Apple' },
              ].map(({ icon, label }) => (
                <button
                  key={label}
                  type="button"
                  title={`${label} (coming soon)`}
                  className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                >
                  {icon}
                </button>
              ))}
            </div>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Secure &amp; Encrypted Connection
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New company?{' '}
            <Link to="/signup" className="font-semibold text-violet-600 hover:underline">
              Start free trial
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
