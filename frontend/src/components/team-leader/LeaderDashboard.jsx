import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, Users } from 'lucide-react';
import API from '../../api/axios';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import { invalidateDashboard } from '../../lib/queryInvalidation';
import { DASHBOARD_STALE_MS, GC_TIME_MS } from '../../lib/queryConfig';
import PageHeader from '../ui/PageHeader';
import LeaderKpiCards from './dashboard/LeaderKpiCards';
import LeaderCharts from './dashboard/LeaderCharts';
import MyTeamPanel from './MyTeamPanel';

export default function LeaderDashboard() {
  const queryClient = useQueryClient();
  const dashboardQuery = useDashboardQuery('/team-leader/dashboard');
  const teamQuery = useQuery({
    queryKey: ['team-leader', 'my-team'],
    queryFn: async () => {
      const { data } = await API.get('/team-leader/my-team', { skipSuccessToast: true });
      return data || { team: null, members: [], message: null };
    },
    staleTime: DASHBOARD_STALE_MS,
    gcTime: GC_TIME_MS,
    placeholderData: (prev) => prev,
  });

  const refresh = useCallback(() => {
    invalidateDashboard(queryClient);
    queryClient.invalidateQueries({ queryKey: ['team-leader', 'my-team'] });
  }, [queryClient]);

  useDataRefresh(['dashboard', 'teams'], refresh);

  const loading = (dashboardQuery.isLoading && !dashboardQuery.data) || (teamQuery.isLoading && !teamQuery.data);
  const fetching = dashboardQuery.isFetching || teamQuery.isFetching;
  const data = dashboardQuery.data;
  const myTeam = teamQuery.data || { team: null, members: [], message: null };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {fetching && (
        <div className="h-0.5 w-full bg-amber-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-amber-500 animate-pulse" />
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Team Command Center"
          description="Monitor squad performance, follow-ups, and conversion progress"
          breadcrumbs={['Team Leader', 'Dashboard']}
        />
      </motion.div>

      <MyTeamPanel team={myTeam.team} members={myTeam.members} message={myTeam.message} loading={false} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-600/10 via-indigo-500/5 to-violet-500/10 p-6 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5" /> Squad Overview
            </div>
            <h2 className="text-xl font-bold text-content-primary">
              {data?.kpis?.activeFollowups} active follow-ups · {data?.kpis?.targetAchievement}% of monthly target
            </h2>
            <p className="text-sm text-content-secondary mt-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {data?.executiveRanking?.length
                ? `Managing ${data.executiveRanking.map((e) => e.name).join(', ')}`
                : 'No executives in your squad yet'}
            </p>
          </div>
        </div>
      </motion.div>

      <LeaderKpiCards kpis={data?.kpis} />
      <LeaderCharts data={data} />
    </div>
  );
}
