import axios, { AxiosError } from 'axios';
import { authStorage } from '@/src/lib/storage';

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

let apiBaseUrl = DEFAULT_API_URL;
let onUnauthorized: (() => void) | null = null;

export function setApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/$/, '');
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function initApiClient() {
  const stored = await authStorage.getApiUrl();
  if (stored) {
    setApiBaseUrl(stored);
  } else if (process.env.EXPO_PUBLIC_API_URL) {
    setApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  }
}

export const apiClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use(async (config) => {
  config.baseURL = getApiBaseUrl();
  const token = await authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenant = await authStorage.getTenantSubdomain();
  if (tenant) {
    config.headers['x-tenant-subdomain'] = tenant;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export function unwrapPagination<T>(data: unknown): { items: T[]; total: number; page: number; limit: number } {
  if (Array.isArray(data)) {
    return { items: data as T[], total: data.length, page: 1, limit: data.length };
  }
  const payload = data as Record<string, unknown>;
  const items = (payload.items || payload.leads || payload.followUps || payload.data || []) as T[];
  return {
    items,
    total: Number(payload.total ?? items.length),
    page: Number(payload.page ?? 1),
    limit: Number(payload.limit ?? (items.length || 20)),
  };
}
