import { lazy, Suspense, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useDashboardQuery } from '../features/dashboard/hooks/useDashboardQuery';
import { invalidateDashboard } from '../lib/queryInvalidation';
import {
  DashboardHeader,
  DashboardHero,
  ActivityTimeline,
  DashboardSkeleton,
  TodayFollowUps,
  ExecutivePerformancePanel,
  LeadSourceChart,
} from '../components/dashboard';
import LeadTrendChart from '../components/dashboard/LeadTrendChart';
import RemindersAlertsPanel from '../components/dashboard/RemindersAlertsPanel';

function PanelSkeleton() {
  return <div className="h-56 rounded-2xl bg-surface border border-subtle animate-pulse" />;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isFetching, refetch } = useDashboardQuery();

  const refreshDashboard = useCallback(() => {
    invalidateDashboard(queryClient);
    refetch();
  }, [queryClient, refetch]);

  useDataRefresh(['dashboard'], refreshDashboard);

  if (isLoading && !stats) return <DashboardSkeleton />;
  if (!stats) return null;

  return (
    <div className="space-y-6 pb-6">
      {isFetching && (
        <div className="h-0.5 w-full bg-blue-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-blue-500 animate-pulse" />
        </div>
      )}

      <DashboardHeader onRefresh={refreshDashboard} isRefreshing={isFetching} />
      <DashboardHero stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <LeadTrendChart stats={stats} />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <Suspense fallback={<PanelSkeleton />}>
            <LeadSourceChart data={stats.leadSourceAnalytics || []} />
          </Suspense>
          <ActivityTimeline activities={stats.activityTimeline || []} stats={stats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Suspense fallback={<PanelSkeleton />}>
          <ExecutivePerformancePanel data={stats.executivePerformance} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <TodayFollowUps followups={stats.todayFollowUps || []} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <RemindersAlertsPanel stats={stats} />
        </Suspense>
      </div>
    </div>
  );
}
