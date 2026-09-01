import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession, User } from '@/src/types';

const KEYS = {
  TOKEN: 'crm_token',
  USER: 'crm_user',
  TENANT: 'crm_tenant_subdomain',
  API_URL: 'crm_api_url',
} as const;

export const authStorage = {
  async saveSession(session: AuthSession, tenantSubdomain?: string) {
    await AsyncStorage.setItem(KEYS.TOKEN, session.token);
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(session));
    if (tenantSubdomain !== undefined) {
      if (tenantSubdomain.trim()) {
        await AsyncStorage.setItem(KEYS.TENANT, tenantSubdomain.trim().toLowerCase());
      } else {
        await AsyncStorage.removeItem(KEYS.TENANT);
      }
    }
  },

  async clearSession() {
    await AsyncStorage.removeItem(KEYS.TOKEN);
    await AsyncStorage.removeItem(KEYS.USER);
  },

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async getTenantSubdomain(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TENANT);
  },

  async setApiUrl(url: string) {
    await AsyncStorage.setItem(KEYS.API_URL, url.trim());
  },

  async getApiUrl(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.API_URL);
  },
};
