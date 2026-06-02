import { AUTH_STORAGE_KEYS } from './constants';

export const authStorage = {
  saveSession(user, token) {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, user.role);
    localStorage.setItem(AUTH_STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    if (token) localStorage.setItem('token', token);
  },

  clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ROLE);
    localStorage.removeItem(AUTH_STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem('token');
  },

  isAuthenticated() {
    return localStorage.getItem(AUTH_STORAGE_KEYS.IS_AUTHENTICATED) === 'true' && !!this.getToken();
  },

  getToken() {
    return localStorage.getItem('token');
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
