import { lazy, Suspense, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useDashboardQuery } from '../features/dashboard/hooks/useDashboardQuery';
import { invalidateDashboard } from '../lib/queryInvalidation';
import {
  DashboardHeader,
  DashboardHero,
  DashboardLeadsTabs,
  TodayFollowUps,
  ActivityTimeline,
  DashboardSkeleton,
} from '../components/dashboard';
import DashboardPanel from '../components/dashboard/DashboardPanel';

const RevenueChart = lazy(() => import('../components/dashboard/RevenueChart'));
const SalesFunnel = lazy(() => import('../components/dashboard/SalesFunnel'));
const SourceAnalyticsPanel = lazy(() => import('../components/dashboard/SourceAnalyticsPanel'));
const ExecutivePerformancePanel = lazy(() => import('../components/dashboard/ExecutivePerformancePanel'));
const AgingChartPanel = lazy(() => import('../components/dashboard/AgingChartPanel'));

function PanelSkeleton() {
  return <div className="h-56 rounded-2xl bg-surface-elevated/60 animate-pulse" />;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isFetching } = useDashboardQuery();

  const refreshDashboard = useCallback(() => {
    invalidateDashboard(queryClient);
  }, [queryClient]);

  useDataRefresh(['dashboard'], refreshDashboard);

  if (isLoading && !stats) return <DashboardSkeleton />;
  if (!stats) return null;

  return (
    <div className="space-y-6 pb-6">
      {isFetching && (
        <div className="h-0.5 w-full bg-brand-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-brand-500 animate-pulse" />
        </div>
      )}
      <DashboardHeader />
      <DashboardHero stats={stats} />

      <DashboardLeadsTabs
        newLeads={stats.newLeads || []}
        newLeadsTotal={stats.newLeadsTotal ?? stats.todayLeads}
        unassignedLeads={stats.unassignedLeads || []}
        unassignedLeadsTotal={stats.unassignedLeadsTotal ?? 0}
        maxRows={5}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <Suspense fallback={<PanelSkeleton />}>
            <RevenueChart data={stats.monthlyRevenue || []} />
          </Suspense>
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<PanelSkeleton />}>
            <SourceAnalyticsPanel data={stats.sourceAnalytics} />
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<PanelSkeleton />}>
          <AgingChartPanel aging={stats.enterpriseKpis?.aging || []} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <ExecutivePerformancePanel data={stats.executivePerformance} compact />
        </Suspense>
      </div>

      <Suspense fallback={<PanelSkeleton />}>
        <SalesFunnel data={stats.salesFunnel || []} />
      </Suspense>

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

      <ActivityTimeline activities={stats.activityTimeline || []} />
    </div>
  );
}
