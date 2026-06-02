import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Lock, User, CheckCircle2 } from 'lucide-react';
import API from '../api/axios';
import { Button } from '../components/ui/button';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    API.get(`/invites/${token}`)
      .then((res) => {
        setInvite(res.data);
        setName(res.data.name || '');
      })
      .catch((err) => setError(err.response?.data?.message || 'Invalid or expired invite'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await API.post('/invites/accept', { token, password, name });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-brand-600/5 via-surface to-violet-600/5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-subtle bg-surface/95 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        <div className="px-8 pt-8 pb-6 text-center border-b border-subtle bg-gradient-to-b from-brand-500/5 to-transparent">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-4">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-content-primary">Join TravelCRM</h1>
          <p className="text-sm text-content-secondary mt-1">Complete your account setup</p>
        </div>

        <div className="p-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-content-primary">Account Activated!</h2>
              <p className="text-sm text-content-secondary">Your account is ready. Sign in to get started.</p>
              <Button className="w-full" onClick={() => navigate('/login')}>Go to Login</Button>
            </div>
          ) : error && !invite ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-rose-600">{error}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>Back to Login</Button>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 rounded-xl bg-surface-elevated/50 border border-subtle text-sm">
                <p className="text-content-muted">Invited as</p>
                <p className="font-semibold text-content-primary mt-0.5">{invite?.roleName}</p>
                <p className="text-content-secondary">{invite?.department} · {invite?.email}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                    <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
                    <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-subtle bg-surface-elevated/50 text-sm outline-none focus:ring-2 focus:ring-brand-500/30" />
                  </div>
                </div>
                {error && invite && <p className="text-sm text-rose-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Activating…' : 'Activate Account'}
                </Button>
              </form>
              <p className="text-center text-xs text-content-muted mt-4">
                Already have an account? <Link to="/login" className="text-brand-600 hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
