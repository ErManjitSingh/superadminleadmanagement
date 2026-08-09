import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { acceptInvite, fetchInvite } from './api/workApi';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const inviteQuery = useQuery({
    queryKey: ['work-invite', token],
    queryFn: () => fetchInvite(token),
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => navigate('/login', { replace: true }),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    acceptMutation.mutate({
      token,
      password,
      name: name.trim() || inviteQuery.data?.name,
    });
  };

  if (inviteQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-surface-app"><div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" /></div>;
  }

  if (inviteQuery.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-app p-5">
        <div className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-7 text-center">
          <h1 className="text-xl font-bold text-content-primary">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-content-secondary">{inviteQuery.error?.response?.data?.message || 'This invitation is invalid or expired.'}</p>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">Go to sign in</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-app p-5">
      <div className="w-full max-w-md rounded-2xl border border-subtle bg-surface p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-content-primary">Join WorkFlow Hub</h1>
        <p className="mt-2 text-sm text-content-secondary">Complete your account for {inviteQuery.data.email}.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-content-primary">Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={inviteQuery.data.name} maxLength={120} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-content-primary">Create password</span>
            <span className="relative block">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
              <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface pl-9 pr-3 text-sm outline-none focus:border-emerald-600" />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-content-primary">Confirm password</span>
            <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" />
          </label>

          {(formError || acceptMutation.isError) && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError || acceptMutation.error?.response?.data?.message || 'Unable to accept invitation.'}
            </div>
          )}

          <button disabled={acceptMutation.isPending} className="h-11 w-full rounded-xl bg-emerald-800 text-sm font-bold text-white disabled:opacity-60">
            {acceptMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
