export type UserRole =
  | 'admin'
  | 'sales_manager'
  | 'sales_executive'
  | 'team_leader'
  | 'accountant'
  | 'operations_manager';

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  roleName?: string;
  companyId?: string | null;
  permissions?: Record<string, unknown>;
}

export interface AuthSession extends User {
  token: string;
  sessionExpiresAt?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface Lead {
  _id: string;
  leadId?: string;
  name: string;
  email?: string;
  phone?: string;
  destination?: string;
  budget?: number;
  status: string;
  isHot?: boolean;
  source?: string;
  assignedTo?: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
  notes?: LeadNote[];
  followUps?: FollowUp[];
}

export interface LeadNote {
  _id: string;
  content: string;
  createdAt: string;
  createdBy?: { name?: string } | string;
}

export interface FollowUp {
  _id: string;
  lead?: Lead | { _id: string; name: string; destination?: string; phone?: string };
  scheduledAt: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  type?: string;
}

export interface DashboardKpis {
  myLeads?: number;
  totalLeads?: number;
  todayFollowups?: number;
  followUpsToday?: number;
  hotLeads?: number;
  quotationsSent?: number;
  convertedLeads?: number;
  monthlyRevenue?: number;
  revenue?: number;
  totalBudget?: number;
  totalTeamLeads?: number;
  pendingFollowups?: number;
  overdueFollowups?: number;
  conversionRate?: number;
  newLeadsToday?: number;
  unassignedLeads?: number;
  avgResponseTime?: string;
}

export interface DashboardAlert {
  key: string;
  label: string;
  count: number;
  tone: 'rose' | 'amber' | 'violet' | 'sky';
}

export interface PipelineStage {
  name: string;
  value: number;
  color: string;
}

export interface SourceSlice {
  name: string;
  value: number;
  pct?: number;
  color?: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  recentLeads?: Lead[];
  todayTasks?: Array<{
    _id: string;
    title: string;
    time: string;
    priority?: string;
    destination?: string;
    leadId?: string;
  }>;
  upcomingFollowups?: Array<{
    _id: string;
    customer?: string;
    destination?: string;
    scheduledAt: string;
    priority?: string;
    leadId?: string;
  }>;
  target?: {
    progress?: number;
    target?: number;
    achieved?: number;
    conversionRate?: number;
  };
  pipelineOverview?: PipelineStage[];
  conversionProgress?: Array<{ stage: string; count: number; color: string }>;
  leadSources?: SourceSlice[];
  leadSourceAnalytics?: SourceSlice[];
  alerts?: DashboardAlert[];
  qualificationWidgets?: {
    leadsWithoutBudget?: number;
    leadsWithoutFollowup?: number;
    hotLeads?: number;
    highBudgetLeads?: number;
    unassignedLeads?: number;
  };
}

export interface NotificationItem {
  _id: string;
  title: string;
  message?: string;
  read?: boolean;
  createdAt: string;
  type?: string;
}

export type LeadFilterKey =
  | 'all'
  | 'new'
  | 'contacted'
  | 'follow-up'
  | 'hot'
  | 'converted'
  | 'lost'
  | 'reactivated';
