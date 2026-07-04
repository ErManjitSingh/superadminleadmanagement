import axios from 'axios';
import { authStorage } from '../auth/authStorage';
import { goToLogin } from '../auth/paths';
import { toast } from '../context/ToastContext';
import { getApiSuccessMessage, getApiErrorMessage, shouldSkipSuccessToast } from './toastMessages';
import {
  emitDataChanged,
  keysFromMutationUrl,
  shouldEmitDataRefresh,
} from '../lib/dataRefresh';
import { getTenantSubdomain } from '../lib/tenantContext';

/** Same-origin /api via Nginx — works on HTTP and HTTPS without mixed-content issues */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    authStorage.touchActivity();
  }
  const tenantSubdomain = getTenantSubdomain();
  if (tenantSubdomain) {
    config.headers['x-tenant-subdomain'] = tenantSubdomain;
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    const { config, data } = response;
    if (shouldEmitDataRefresh(config)) {
      emitDataChanged(keysFromMutationUrl(config.url, config.method));
    }
    if (!shouldSkipSuccessToast(config)) {
      toast.success(getApiSuccessMessage(config, data));
    }
    return response;
  },
  (error) => {
    const isLogoutRequest = error.config?.url?.includes('/auth/logout');
    if (error.response?.status === 401 && !isLogoutRequest) {
      authStorage.clearSession();
      if (!window.location.pathname.endsWith('/login')) {
        goToLogin();
      }
    } else if (!error.config?.skipErrorToast) {
      toast.error(getApiErrorMessage(error));
    }
    return Promise.reject(error);
  }
);

export default API;
