import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Mail, XCircle } from 'lucide-react';
import API from '../api/axios';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    API.post('/public/verify-email', { token }, { skipSuccessToast: true, skipErrorToast: true })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified. You can now access your workspace.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-xl">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-violet-600" />
            <p className="mt-4 text-sm text-slate-600">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 text-xl font-bold text-slate-900">Email Verified</h1>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <Link to="/login" className="mt-6 inline-flex h-11 items-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white">
              Continue to Login
            </Link>
          </>
        )}
        {(status === 'error' || status === 'idle') && status !== 'verifying' && (
          <>
            {status === 'error' ? (
              <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            ) : (
              <Mail className="mx-auto h-12 w-12 text-violet-500" />
            )}
            <h1 className="mt-4 text-xl font-bold text-slate-900">
              {status === 'error' ? 'Verification Failed' : 'Check Your Email'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {message || 'Open the verification link we sent to your business email.'}
            </p>
            <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-violet-600 hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
