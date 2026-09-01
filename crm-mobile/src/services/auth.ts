import { apiClient } from '@/src/lib/apiClient';
import type { AuthSession } from '@/src/types';

export async function loginRequest(
  email: string,
  password: string,
  tenantSubdomain?: string
): Promise<AuthSession> {
  const headers: Record<string, string> = {};
  if (tenantSubdomain?.trim()) {
    headers['x-tenant-subdomain'] = tenantSubdomain.trim().toLowerCase();
  }
  const { data } = await apiClient.post<AuthSession>(
    '/auth/login',
    { email, password },
    { headers }
  );
  if (!data?.token) {
    throw new Error('Invalid response from server');
  }
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    /* ignore */
  }
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}
