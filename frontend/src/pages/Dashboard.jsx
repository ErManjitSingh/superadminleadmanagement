import { useCallback, useEffect, useState } from 'react';
import API from '../api/axios';
import { useDataRefresh } from '../hooks/useDataRefresh';
import {
  DashboardHeader,
  DashboardHero,
  LeadSourceChart,
  RevenueChart,
  SalesFunnel,
  RecentLeadsTable,
  TodayFollowUps,
  TeamPerformance,
  ActivityTimeline,
  DashboardSkeleton,
} from '../components/dashboard';
import DashboardPanel from '../components/dashboard/DashboardPanel';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(() => {
    setLoading(true);
    API.get('/dashboard/stats', { skipSuccessToast: true })
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useDataRefresh(['dashboard', 'leads', 'followups'], loadStats);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return null;

  return (
    <div className="space-y-6 pb-6">
      <DashboardHeader />
      <DashboardHero stats={stats} />

      <RecentLeadsTable
        leads={stats.newLeads || []}
        totalCount={stats.newLeadsTotal ?? stats.todayLeads}
        maxRows={5}
        title="New Leads"
        subtitle="Today's fresh inquiries"
        viewAllHref="/leads/new-leads"
        emptyMessage="No new leads today"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <RevenueChart data={stats.monthlyRevenue || []} />
        </div>
        <div className="lg:col-span-4">
          <LeadSourceChart data={stats.leadSourceAnalytics || []} />
        </div>
      </div>

      <SalesFunnel data={stats.salesFunnel || []} />

      <TodayFollowUps followups={stats.todayFollowUps || []} />

      <DashboardPanel title="Reactivated Lead Tracker" subtitle="Live progress across all reactivated leads">
        <div className="space-y-2">
          {stats.reactivationWidget?.liveProgress?.length ? stats.reactivationWidget.liveProgress.map((lead) => (
            <div key={lead._id} className="p-3 rounded-xl border border-subtle bg-surface-elevated/40">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-content-primary truncate">{lead.name}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  {lead.stage?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-content-muted mt-1">{lead.executive}</p>
            </div>
          )) : <p className="text-sm text-content-muted">No reactivated leads yet.</p>}
        </div>
      </DashboardPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TeamPerformance agents={stats.teamPerformance || []} />
        <ActivityTimeline activities={stats.activityTimeline || []} />
      </div>
    </div>
  );
}
