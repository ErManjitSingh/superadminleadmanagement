import { apiClient, unwrapPagination } from '@/src/lib/apiClient';
import { getRoleApiPrefix } from '@/src/constants/roles';
import type { FollowUp, UserRole } from '@/src/types';

function followupsBase(role: UserRole) {
  const prefix = getRoleApiPrefix(role);
  return prefix ? `${prefix}/followups` : '/followups';
}

export async function fetchFollowUps(
  role: UserRole,
  params: { page?: number; limit?: number; tab?: string; status?: string } = {}
) {
  const { data } = await apiClient.get(followupsBase(role), {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 30,
      tab: params.tab,
      status: params.status,
    },
  });
  return unwrapPagination<FollowUp>(data);
}

export async function fetchFollowUpSummary(role: UserRole) {
  const prefix = getRoleApiPrefix(role);
  const path = prefix ? `${prefix}/followups/summary` : '/followups/summary';
  const { data } = await apiClient.get(path);
  return data;
}

export async function createFollowUp(
  role: UserRole,
  payload: {
    leadId: string;
    scheduledAt: string;
    notes?: string;
    priority?: string;
    type?: string;
  }
) {
  const { data } = await apiClient.post(followupsBase(role), payload);
  return data;
}

export async function updateFollowUp(
  role: UserRole,
  id: string,
  payload: Partial<Pick<FollowUp, 'scheduledAt' | 'notes' | 'status' | 'priority'>>
) {
  const { data } = await apiClient.put(`${followupsBase(role)}/${id}`, payload);
  return data;
}
