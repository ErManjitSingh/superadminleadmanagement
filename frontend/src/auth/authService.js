import API from '../api/axios';
import { ROLE_DASHBOARD_PATHS, VALID_ROLES } from './constants';
import { authStorage } from './authStorage';

export class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message);
    this.code = code;
  }
}

export const authService = {
  async login(email, password) {
    const { data } = await API.post('/auth/login', { email, password }, {
      skipSuccessToast: true,
      skipErrorToast: true,
    });
    if (!data?.token) throw new AuthError('Invalid response from server', 'INVALID_RESPONSE');
    authStorage.saveSession(data, data.token, {
      sessionExpiresAt: data.sessionExpiresAt,
    });
    return data;
  },

  async logout() {
    try {
      await API.post('/auth/logout', {}, { skipSuccessToast: true, skipErrorToast: true });
    } catch {
      /* session cleared locally regardless */
    } finally {
      authStorage.clearSession();
    }
  },

  async fetchCurrentUser() {
    const { data } = await API.get('/auth/me');
    const token = authStorage.getToken();
    if (token) {
      authStorage.saveSession(data, token, { sessionExpiresAt: data.sessionExpiresAt });
    }
    return data;
  },

  getCurrentUser() {
    if (!authStorage.isAuthenticated()) return null;
    const stored = authStorage.getStoredUser();
    const role = authStorage.getStoredRole();
    if (!stored || !role || stored.role !== role) {
      authStorage.clearSession();
      return null;
    }
    if (!VALID_ROLES.includes(stored.role)) {
      authStorage.clearSession();
      return null;
    }
    return stored;
  },

  getDashboardPath(role) {
    return ROLE_DASHBOARD_PATHS[role] || '/login';
  },

  isValidRole(role) {
    return VALID_ROLES.includes(role);
  },
};
