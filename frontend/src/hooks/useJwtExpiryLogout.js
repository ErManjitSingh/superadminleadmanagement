import { useEffect } from 'react';
import { authStorage } from '../auth/authStorage';
import { toast } from '../context/ToastContext';

const MAX_TIMEOUT_MS = 2_147_000_000;

export function useJwtExpiryLogout(user, logout) {
  useEffect(() => {
    if (!user) return undefined;

    let timeoutId;
    let expired = false;

    const expireSession = async () => {
      if (expired) return;
      expired = true;
      await logout({ redirect: true, skipRequest: true });
      toast.info('Your session has expired. Please sign in again.');
    };

    const scheduleExpiry = () => {
      window.clearTimeout(timeoutId);
      const expiresAt = authStorage.getTokenExpiresAt();
      if (!expiresAt) return;

      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        expireSession();
        return;
      }

      timeoutId = window.setTimeout(
        scheduleExpiry,
        Math.min(remaining, MAX_TIMEOUT_MS),
      );
    };

    const checkOnResume = () => {
      if (document.visibilityState === 'visible') scheduleExpiry();
    };

    const handleStorage = (event) => {
      if (event.key !== 'token') return;
      if (!event.newValue) {
        expireSession();
        return;
      }
      scheduleExpiry();
    };

    scheduleExpiry();
    window.addEventListener('focus', scheduleExpiry);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', checkOnResume);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('focus', scheduleExpiry);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', checkOnResume);
    };
  }, [user, logout]);
}
