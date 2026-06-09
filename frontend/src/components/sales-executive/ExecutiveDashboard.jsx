import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Plane } from 'lucide-react';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import { invalidateDashboard } from '../../lib/queryInvalidation';
import PageHeader from '../ui/PageHeader';
import ExecutiveKpiCards from './dashboard/ExecutiveKpiCards';
import ExecutiveDashboardPanels from './dashboard/ExecutiveDashboardPanels';

export default function ExecutiveDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useDashboardQuery('/sales-executive/dashboard');

  const refresh = useCallback(() => {
    invalidateDashboard(queryClient);
  }, [queryClient]);

  useDataRefresh(['dashboard'], refresh);

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {isFetching && (
        <div className="h-0.5 w-full bg-sky-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-sky-500 animate-pulse" />
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Sales Workspace"
          description="Your leads, follow-ups, and conversion pipeline"
          breadcrumbs={['Sales Executive', 'Dashboard']}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-600/10 via-emerald-500/5 to-cyan-500/10 p-6 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Your Pipeline
            </div>
            <h2 className="text-xl font-bold text-content-primary">
              {data?.kpis?.todayFollowups} follow-ups today · {data?.kpis?.hotLeads} hot leads need attention
            </h2>
            <p className="text-sm text-content-secondary mt-1 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" /> Focus on conversion — you're at {data?.target?.progress}% of monthly target
            </p>
          </div>
        </div>
      </motion.div>

      <ExecutiveKpiCards kpis={data?.kpis} />
      <ExecutiveDashboardPanels data={data} />
    </div>
  );
}
