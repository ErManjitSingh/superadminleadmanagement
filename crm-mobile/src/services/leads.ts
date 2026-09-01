import { apiClient, unwrapPagination } from '@/src/lib/apiClient';
import { getRoleApiPrefix } from '@/src/constants/roles';
import type { DashboardData, Lead, LeadFilterKey, LeadNote, UserRole } from '@/src/types';

function leadsPath(role: UserRole, suffix = '') {
  const prefix = getRoleApiPrefix(role);
  if (prefix) return `${prefix}/leads${suffix}`;
  return `/leads${suffix}`;
}

export async function fetchDashboard(role: UserRole): Promise<DashboardData> {
  const prefix = getRoleApiPrefix(role);
  if (prefix) {
    const { data } = await apiClient.get(`${prefix}/dashboard`);
    return data;
  }
  const { data } = await apiClient.get('/dashboard/stats');
  return { kpis: data?.kpis || data || {} };
}

export async function fetchLeads(
  role: UserRole,
  params: { page?: number; limit?: number; filter?: LeadFilterKey; search?: string } = {}
) {
  const { data } = await apiClient.get(leadsPath(role), {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      filter: params.filter && params.filter !== 'all' ? params.filter : undefined,
      search: params.search || undefined,
    },
  });
  return unwrapPagination<Lead>(data);
}

export async function fetchLeadDetail(role: UserRole, id: string): Promise<Lead> {
  const { data } = await apiClient.get(leadsPath(role, `/${id}`));
  return data.lead || data;
}

export async function fetchLeadNotes(role: UserRole, id: string): Promise<LeadNote[]> {
  const { data } = await apiClient.get(leadsPath(role, `/${id}/notes-list`));
  return data.notes || data.items || data || [];
}

export async function updateLead(
  role: UserRole,
  id: string,
  payload: Partial<Pick<Lead, 'status'>> & Record<string, unknown>
) {
  const { data } = await apiClient.put(leadsPath(role, `/${id}`), payload);
  return data.lead || data;
}

export async function addLeadNote(role: UserRole, id: string, content: string) {
  const { data } = await apiClient.post(leadsPath(role, `/${id}/notes`), { content });
  return data;
}

export async function fetchNotifications(role: UserRole) {
  const prefix = getRoleApiPrefix(role);
  const path = prefix ? `${prefix}/notifications` : '/notifications';
  const { data } = await apiClient.get(path, { params: { page: 1, limit: 30 } });
  return unwrapPagination(data);
}

export async function fetchProfile(role: UserRole) {
  const prefix = getRoleApiPrefix(role);
  if (!prefix) {
    const { data } = await apiClient.get('/auth/me');
    return data;
  }
  const { data } = await apiClient.get(`${prefix}/profile`);
  return data;
}
