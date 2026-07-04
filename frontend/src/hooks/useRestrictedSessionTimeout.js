import { useEffect, useRef } from 'react';
import { authStorage } from '../auth/authStorage';
import { requiresRestrictedSession } from '../auth/sessionPolicy';
import { goToLogin } from '../auth/paths';
import { toast } from '../context/ToastContext';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
const CHECK_INTERVAL_MS = 60 * 1000;
const TOUCH_THROTTLE_MS = 30 * 1000;

export function useRestrictedSessionTimeout(user, logout) {
  const lastTouchRef = useRef(0);

  useEffect(() => {
    if (!user || !requiresRestrictedSession(user.role)) return undefined;

    const touch = () => {
      const now = Date.now();
      if (now - lastTouchRef.current < TOUCH_THROTTLE_MS) return;
      lastTouchRef.current = now;
      authStorage.touchActivity();
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, touch, { passive: true }));

    const intervalId = window.setInterval(async () => {
      if (!authStorage.isRestrictedSessionExpired()) return;
      try {
        await logout({ redirect: false });
      } catch {
        authStorage.clearSession();
      }
      toast.info('Your session ended due to inactivity. Please sign in again.');
      if (!window.location.pathname.endsWith('/login')) {
        goToLogin();
      }
    }, CHECK_INTERVAL_MS);

    authStorage.touchActivity();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, touch));
      window.clearInterval(intervalId);
    };
  }, [user, logout]);
}
