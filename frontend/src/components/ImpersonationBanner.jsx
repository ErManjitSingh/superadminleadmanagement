import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { getImpersonationSession, setImpersonationSession } from '../pages/ImpersonationCallback';
import { authStorage } from '../auth/authStorage';
import { Button } from './ui/button';

export default function ImpersonationBanner() {
  const navigate = useNavigate();
  const session = getImpersonationSession();

  if (!session?.active) return null;

  function handleReturn() {
    authStorage.clearSession();
    setImpersonationSession(false);
    const superAdminUrl = import.meta.env.VITE_SUPERADMIN_URL || 'http://localhost:5174/admin';
    window.location.href = superAdminUrl;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-amber-300/50 bg-amber-50 px-4 py-2 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/80 dark:text-amber-100">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        You are currently in Impersonation Mode.
      </div>
      <Button variant="outline" size="sm" onClick={handleReturn} className="shrink-0 border-amber-400/60 bg-white/80 text-amber-950 hover:bg-white dark:bg-amber-900/40 dark:text-amber-50">
        <ArrowLeft className="h-3.5 w-3.5" />
        Return to Super Admin
      </Button>
    </div>
  );
}
