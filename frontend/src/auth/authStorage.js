import { AUTH_STORAGE_KEYS } from './constants';
import { requiresRestrictedSession, SESSION_TIMEOUT_MS } from './sessionPolicy';

function readJwtExpiry(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = JSON.parse(window.atob(padded));
    return Number.isFinite(Number(decoded.exp)) ? Number(decoded.exp) * 1000 : null;
  } catch {
    return null;
  }
}

export const authStorage = {
  saveSession(user, token, options = {}) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, user.role);
    localStorage.setItem(AUTH_STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    if (token) localStorage.setItem('token', token);

    if (requiresRestrictedSession(user.role)) {
      const expiresAt = options.sessionExpiresAt
        ? new Date(options.sessionExpiresAt).getTime()
        : Date.now() + SESSION_TIMEOUT_MS;
      const now = Date.now();
      localStorage.setItem(AUTH_STORAGE_KEYS.SESSION_EXPIRES_AT, String(expiresAt));
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY_AT, String(now));
    } else {
      this.clearRestrictedSessionKeys();
    }
  },

  clearRestrictedSessionKeys() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION_EXPIRES_AT);
    localStorage.removeItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY_AT);
  },

  clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ROLE);
    localStorage.removeItem(AUTH_STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem('token');
    this.clearRestrictedSessionKeys();
  },

  touchActivity() {
    const user = this.getStoredUser();
    if (!user || !requiresRestrictedSession(user.role)) return;

    const now = Date.now();
    localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY_AT, String(now));
    localStorage.setItem(
      AUTH_STORAGE_KEYS.SESSION_EXPIRES_AT,
      String(now + SESSION_TIMEOUT_MS)
    );
  },

  isRestrictedSessionExpired() {
    const user = this.getStoredUser();
    if (!user || !requiresRestrictedSession(user.role)) return false;

    const expiresAt = Number(localStorage.getItem(AUTH_STORAGE_KEYS.SESSION_EXPIRES_AT));
    const lastActivity = Number(localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY_AT));

    if (!expiresAt || !lastActivity) return true;

    const now = Date.now();
    if (now >= expiresAt) return true;
    if (now - lastActivity >= SESSION_TIMEOUT_MS) return true;

    return false;
  },

  isAuthenticated() {
    if (this.isTokenExpired() || this.isRestrictedSessionExpired()) {
      this.clearSession();
      return false;
    }
    return localStorage.getItem(AUTH_STORAGE_KEYS.IS_AUTHENTICATED) === 'true' && !!this.getToken();
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getTokenExpiresAt() {
    return readJwtExpiry(this.getToken());
  },

  isTokenExpired() {
    const expiresAt = this.getTokenExpiresAt();
    return expiresAt !== null && Date.now() >= expiresAt;
  },

  getStoredUser() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getStoredRole() {
    return localStorage.getItem(AUTH_STORAGE_KEYS.ROLE);
  },
};
