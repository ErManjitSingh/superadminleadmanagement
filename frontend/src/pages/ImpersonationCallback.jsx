import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authStorage } from '../auth/authStorage';
import { requiresRestrictedSession } from '../auth/sessionPolicy';

const IMPERSONATION_KEY = 'crm_impersonation';

export function setImpersonationSession(active, companyName) {
  if (active) {
    sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify({ active: true, companyName }));
  } else {
    sessionStorage.removeItem(IMPERSONATION_KEY);
  }
}

export function getImpersonationSession() {
  const raw = sessionStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ImpersonationCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const userRaw = params.get('user');
    const isImpersonation = params.get('impersonation') === 'true';

    if (!token || !userRaw) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      const sessionMeta = requiresRestrictedSession(user.role)
        ? { sessionExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() }
        : {};
      authStorage.saveSession(user, token, sessionMeta);

      if (isImpersonation) {
        setImpersonationSession(true, params.get('companyName') || 'Company');
      }

      navigate(user.dashboardPath || '/admin/dashboard', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  }, [params, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-content-secondary">Signing in…</p>
      </div>
    </div>
  );
}
