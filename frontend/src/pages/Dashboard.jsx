import { Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { useDashboardQuery } from '../features/dashboard/hooks/useDashboardQuery';
import { invalidateDashboard } from '../lib/queryInvalidation';
import {
  DashboardHeader,
  DashboardHero,
  ActivityTimeline,
  DashboardSkeleton,
  LeadSourceChart,
  RecentLeadsTable,
} from '../components/dashboard';
import ConversionOverview from '../components/dashboard/ConversionOverview';
import LeadsByLocationPanel from '../components/dashboard/LeadsByLocationPanel';
import OnboardingChecklist from '../components/onboarding/OnboardingChecklist';
import DnsPendingBanner from '../components/onboarding/DnsPendingBanner';
import TrialExpiryBanner from '../components/onboarding/TrialExpiryBanner';
import { useAuth } from '../context/AuthContext';

function PanelSkeleton() {
  return <div className="h-64 rounded-2xl bg-surface border border-subtle animate-pulse" />;
}

export default function Dashboard() {
  const { user } = useAuth();
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
    <div className="space-y-5 pb-8">
      {isFetching && (
        <div className="h-0.5 w-full bg-blue-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-blue-500 animate-pulse" />
        </div>
      )}

      {user?.role === 'admin' && <TrialExpiryBanner />}
      <DashboardHeader onRefresh={refreshDashboard} isRefreshing={isFetching} />
      <DashboardHero stats={stats} />
      {user?.role === 'admin' && <OnboardingChecklist compact />}
      {user?.role === 'admin' && <DnsPendingBanner />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Suspense fallback={<PanelSkeleton />}>
          <LeadSourceChart data={stats.leadSourceAnalytics || []} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <LeadsByLocationPanel data={stats.leadsByLocation || []} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <ConversionOverview data={stats.salesFunnel || []} totalLeads={stats.totalLeads || 0} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <RecentLeadsTable
            leads={stats.recentLeads || []}
            totalCount={stats.totalLeads}
            maxRows={6}
            viewAllHref="/leads"
          />
        </div>
        <div className="xl:col-span-4">
          <ActivityTimeline activities={stats.activityTimeline || []} stats={stats} />
        </div>
      </div>
    </div>
  );
}
