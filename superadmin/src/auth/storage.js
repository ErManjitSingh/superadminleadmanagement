const KEYS = {
  TOKEN: 'superadmin_token',
  USER: 'superadmin_user',
};

export const superAdminStorage = {
  saveSession(user, token) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    localStorage.setItem(KEYS.TOKEN, token);
  },

  clearSession() {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.TOKEN);
  },

  getToken() {
    return localStorage.getItem(KEYS.TOKEN);
  },

  getUser() {
    const raw = localStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};
