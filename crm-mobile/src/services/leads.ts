import { apiClient, unwrapPagination } from '@/src/lib/apiClient';
import { getRoleApiPrefix } from '@/src/constants/roles';
import type { DashboardAlert, DashboardData, Lead, LeadFilterKey, LeadNote, UserRole } from '@/src/types';

function leadsPath(role: UserRole, suffix = '') {
  const prefix = getRoleApiPrefix(role);
  if (prefix) return `${prefix}/leads${suffix}`;
  return `/leads${suffix}`;
}

const ALERT_TONES = {
  leadsWithoutBudget: 'rose',
  leadsWithoutFollowup: 'amber',
  highBudgetLeads: 'violet',
  unassignedLeads: 'sky',
} as const;

function buildAlerts(raw: Record<string, unknown>): DashboardAlert[] {
  const q = (raw.qualificationWidgets && typeof raw.qualificationWidgets === 'object'
    ? raw.qualificationWidgets
    : {}) as Record<string, unknown>;
  const rows: Array<{ key: keyof typeof ALERT_TONES; label: string }> = [
    { key: 'leadsWithoutBudget', label: 'No budget' },
    { key: 'leadsWithoutFollowup', label: 'No follow-up' },
    { key: 'highBudgetLeads', label: 'High budget' },
    { key: 'unassignedLeads', label: 'Unassigned' },
  ];
  return rows
    .map((row) => {
      const fromQ = q[row.key];
      const fromRaw = raw[row.key];
      // Prefer numeric widget values; never treat lead arrays as the count value for display objects
      const count = asNumber(
        typeof fromQ === 'number' || typeof fromQ === 'string'
          ? fromQ
          : row.key === 'unassignedLeads'
            ? raw.unassignedLeadsTotal
            : Array.isArray(fromRaw)
              ? fromRaw.length
              : fromRaw
      );
      return {
        key: row.key,
        label: row.label,
        count,
        tone: ALERT_TONES[row.key],
      };
    })
    .filter((a) => a.count > 0);
}

function asText(value: unknown, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.label === 'string') return obj.label;
    if (typeof obj.title === 'string') return obj.title;
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function isSourceRow(item: unknown): item is { name: string; value: number; pct?: number; color?: string } {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (typeof obj.name === 'string' || typeof obj._id === 'string') && !('phone' in obj && 'leadId' in obj);
}

function normalizeSources(raw: unknown): DashboardData['leadSources'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isSourceRow)
    .map((item, i) => {
      const obj = item as Record<string, unknown>;
      return {
        name: asText(obj.name ?? obj._id, 'Unknown'),
        value: asNumber(obj.value ?? obj.count),
        pct: obj.pct != null ? asNumber(obj.pct) : undefined,
        color: typeof obj.color === 'string' ? obj.color : undefined,
      };
    })
    .filter((s) => s.name);
}

function normalizePipeline(raw: Record<string, unknown>): DashboardData['pipelineOverview'] {
  const fromOverview = Array.isArray(raw.pipelineOverview) ? raw.pipelineOverview : null;
  const fromConversion = Array.isArray(raw.conversionProgress) ? raw.conversionProgress : null;
  const fromFunnel = Array.isArray(raw.salesFunnel) ? raw.salesFunnel : null;

  const source = fromOverview || fromConversion || fromFunnel || [];
  return source
    .map((item: Record<string, unknown>) => {
      if (!item || typeof item !== 'object') return null;
      // Skip enriched lead objects accidentally mixed into pipeline arrays
      if ('phone' in item && ('leadId' in item || 'isUnassigned' in item)) return null;
      const name = asText(item.name ?? item.stage, '');
      if (!name) return null;
      return {
        name,
        value: asNumber(item.value ?? item.count),
        color: typeof item.color === 'string' ? item.color : '#7C3AED',
      };
    })
    .filter(Boolean) as DashboardData['pipelineOverview'];
}

function leadIdFrom(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'object' && value && '_id' in value) {
    const id = (value as { _id?: unknown })._id;
    return typeof id === 'string' && id.trim() ? id.trim() : undefined;
  }
  return undefined;
}

function normalizeTodayTasks(raw: Record<string, unknown>): DashboardData['todayTasks'] {
  if (Array.isArray(raw.todayTasks) && raw.todayTasks.length) {
    return raw.todayTasks.map((t: Record<string, unknown>) => ({
      _id: asText(t._id, Math.random().toString(36)),
      title: asText(t.title, 'Follow-up'),
      time: asText(t.time ?? t.scheduledAt, new Date().toISOString()),
      priority: asText(t.priority, 'medium'),
      destination: t.destination != null ? asText(t.destination, '') : undefined,
      leadId: leadIdFrom(t.leadId ?? t.lead),
    }));
  }
  if (Array.isArray(raw.todayFollowUps)) {
    return raw.todayFollowUps.map((f: Record<string, unknown>) => ({
      _id: asText(f._id, Math.random().toString(36)),
      title: `Follow up with ${asText(f.customerName ?? (f.lead as { name?: string })?.name, 'Lead')}`,
      time: asText(f.scheduledAt, new Date().toISOString()),
      priority: asText(f.priority, 'medium'),
      destination: undefined,
      leadId: leadIdFrom(f.leadId ?? f.lead),
    }));
  }
  return [];
}

function normalizeUpcoming(raw: Record<string, unknown>): DashboardData['upcomingFollowups'] {
  if (!Array.isArray(raw.upcomingFollowups)) return [];
  return raw.upcomingFollowups.map((f: Record<string, unknown>) => {
    const lead = f.lead && typeof f.lead === 'object' ? (f.lead as Record<string, unknown>) : null;
    return {
      _id: asText(f._id, Math.random().toString(36)),
      customer: asText(f.customer ?? f.customerName ?? lead?.name, 'Lead'),
      destination: asText(f.destination ?? lead?.destination, '') || undefined,
      scheduledAt: asText(f.scheduledAt, new Date().toISOString()),
      priority: asText(f.priority, 'medium'),
      leadId: leadIdFrom(f.leadId ?? f.lead),
    };
  });
}

function normalizeRecentLeads(raw: unknown): Lead[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object' && (item as Lead)._id)
    .map((item) => {
      const lead = item as Lead;
      return {
        ...lead,
        name: asText(lead.name, 'Lead'),
        destination: lead.destination != null ? asText(lead.destination, '') : undefined,
        status: asText(lead.status, 'new'),
        leadId: lead.leadId != null ? asText(lead.leadId, '') : undefined,
        phone: lead.phone != null ? asText(lead.phone, '') : undefined,
      };
    });
}

export function normalizeDashboard(raw: Record<string, unknown> = {}): DashboardData {
  const nestedKpis = (raw.kpis && typeof raw.kpis === 'object' && !Array.isArray(raw.kpis)
    ? raw.kpis
    : {}) as Record<string, unknown>;
  const q = (raw.qualificationWidgets && typeof raw.qualificationWidgets === 'object'
    ? raw.qualificationWidgets
    : {}) as Record<string, unknown>;

  const totalLeads = asNumber(
    nestedKpis.totalLeads ?? raw.totalLeads ?? nestedKpis.myLeads ?? nestedKpis.totalTeamLeads
  );
  const hotLeads = asNumber(nestedKpis.hotLeads ?? q.hotLeads ?? raw.hotLeads);
  const convertedLeads = asNumber(nestedKpis.convertedLeads ?? raw.convertedLeads ?? raw.wonLeads);
  const todayFollowups = asNumber(
    nestedKpis.todayFollowups ?? nestedKpis.followUpsToday ?? raw.followUpsToday
  );
  const revenue = asNumber(nestedKpis.monthlyRevenue ?? nestedKpis.revenue ?? raw.revenue ?? raw.monthlyRevenue);
  const conversionRate = asNumber(nestedKpis.conversionRate ?? raw.conversionRate);
  const quotationsSent = asNumber(nestedKpis.quotationsSent ?? raw.quotationsSent);
  const pendingFollowups = asNumber(nestedKpis.pendingFollowups ?? raw.pendingFollowups);
  const overdueFollowups = asNumber(nestedKpis.overdueFollowups ?? raw.overdueFollowups);
  const newLeadsToday = asNumber(nestedKpis.newLeadsToday ?? raw.newLeadsToday ?? raw.todayLeads);
  const unassignedLeads = asNumber(
    nestedKpis.unassignedLeads ?? q.unassignedLeads ?? raw.unassignedLeadsTotal
  );

  const fromLeadSources = normalizeSources(raw.leadSources);
  const leadSources = fromLeadSources.length
    ? fromLeadSources
    : normalizeSources(raw.leadSourceAnalytics);

  return {
    kpis: {
      myLeads: asNumber(nestedKpis.myLeads ?? totalLeads),
      totalLeads,
      totalTeamLeads: asNumber(nestedKpis.totalTeamLeads ?? totalLeads),
      todayFollowups,
      followUpsToday: todayFollowups,
      hotLeads,
      quotationsSent,
      convertedLeads,
      monthlyRevenue: revenue,
      revenue,
      totalBudget: asNumber(nestedKpis.totalBudget ?? raw.totalBudget),
      pendingFollowups,
      overdueFollowups,
      conversionRate,
      newLeadsToday,
      unassignedLeads,
      avgResponseTime: asText(nestedKpis.avgResponseTime ?? raw.avgResponseTime, '—'),
    },
    recentLeads: normalizeRecentLeads(raw.recentLeads),
    todayTasks: normalizeTodayTasks(raw),
    upcomingFollowups: normalizeUpcoming(raw),
    target: (raw.target as DashboardData['target']) || undefined,
    pipelineOverview: normalizePipeline(raw),
    conversionProgress: raw.conversionProgress as DashboardData['conversionProgress'],
    leadSources,
    leadSourceAnalytics: leadSources,
    qualificationWidgets: raw.qualificationWidgets as DashboardData['qualificationWidgets'],
    alerts: buildAlerts(raw),
  };
}

export async function fetchDashboard(role: UserRole): Promise<DashboardData> {
  const prefix = getRoleApiPrefix(role);
  if (prefix) {
    const { data } = await apiClient.get(`${prefix}/dashboard`);
    return normalizeDashboard(data || {});
  }
  const { data } = await apiClient.get('/dashboard/stats');
  return normalizeDashboard(data || {});
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
  const raw = data.notes || data.items || data || [];
  const list = Array.isArray(raw) ? raw : [];
  return list.map((n: Record<string, unknown>) => ({
    _id: String(n._id || n.id || Math.random()),
    content: String(n.content || n.message || n.text || n.note || ''),
    createdAt: String(n.createdAt || n.date || ''),
    createdBy:
      (n.createdBy as LeadNote['createdBy']) ||
      (typeof n.user === 'string' ? n.user : (n.user as { name?: string })) ||
      undefined,
  }));
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
  const { data } = await apiClient.post(leadsPath(role, `/${id}/notes`), {
    text: content,
    content,
  });
  return data;
}

export interface LeadTimelineItem {
  id: string;
  type: string;
  title?: string;
  description?: string;
  user?: string;
  date: string;
  notes?: string;
  meta?: Record<string, unknown>;
}

/** Timeline is on the shared /leads route (all CRM roles with lead access). */
export async function fetchLeadTimeline(leadId: string): Promise<LeadTimelineItem[]> {
  const { data } = await apiClient.get(`/leads/${leadId}/timeline`, {
    params: { page: 1, limit: 40 },
  });
  return data?.data || data?.items || data?.activities || [];
}

export async function deleteLead(role: UserRole, id: string) {
  if (role === 'admin') {
    const { data } = await apiClient.delete(`/leads/${id}`);
    return data;
  }
  throw new Error('Only admin can delete leads from the app');
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
