import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Check } from 'lucide-react';
import API from '../api/axios';
import { APP_PLATFORM_DOMAIN } from '../config/branding';
import { authStorage } from '../auth/authStorage';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Card } from '../components/ui/card';

export default function SignupPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({
    companyName: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    phone: '',
    planSlug: 'starter',
    subdomain: '',
    country: 'India',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    API.get('/public/plans', { skipSuccessToast: true, skipErrorToast: true })
      .then((r) => setPlans(r.data?.data || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/public/signup', form, { skipSuccessToast: true });
      const data = res.data;
      authStorage.saveSession(data, data.token, {
        sessionExpiresAt: data.sessionExpiresAt,
      });
      setDone(true);
      setTimeout(() => navigate(data.dashboardPath || '/admin/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Welcome aboard!</h1>
          <p className="mt-2 text-sm text-content-secondary">Redirecting to your CRM…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-app p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card className="p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Start your free trial</h1>
              <p className="text-sm text-content-secondary">Create your company workspace in minutes</p>
            </div>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Your Name</Label>
                <Input required value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Work Email</Label>
              <Input type="email" required value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <Label>Subdomain (optional)</Label>
              <Input placeholder="acme" value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} />
              <p className="mt-1 text-xs text-content-muted">acme.{APP_PLATFORM_DOMAIN}</p>
            </div>
            <div>
              <Label>Plan</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-strong bg-surface px-3 text-sm"
                value={form.planSlug}
                onChange={(e) => setForm({ ...form, planSlug: e.target.value })}
              >
                {(plans.length ? plans : [{ slug: 'starter', name: 'Starter' }]).map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create Company'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-content-muted">
            Already have an account? <a href="/login" className="text-brand-600 hover:underline">Sign in</a>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
