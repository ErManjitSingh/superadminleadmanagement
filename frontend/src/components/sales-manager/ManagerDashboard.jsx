import { useCallback, useEffect, useState } from 'react';
import { useDataRefresh } from '../../hooks/useDataRefresh';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import ManagerKpiCards from './dashboard/ManagerKpiCards';
import ManagerCharts from './dashboard/ManagerCharts';
import ManagerDashboardPanels from './dashboard/ManagerDashboardPanels';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    API.get('/sales-manager/dashboard', { skipSuccessToast: true })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useDataRefresh(['dashboard', 'leads', 'followups', 'quotations', 'teams'], load);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader
          title="Sales Manager Command Center"
          description="Team pipeline, approvals, and performance at a glance"
          breadcrumbs={['Sales Manager', 'Dashboard']}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/10 via-brand-500/5 to-sky-500/10 p-6 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Manager Overview
            </div>
            <h2 className="text-xl font-bold text-content-primary">Your team has {data?.kpis?.pendingFollowups} follow-ups pending today</h2>
            <p className="text-sm text-content-secondary mt-1">{data?.kpis?.newLeadsToday} new leads arrived · {data?.pendingApprovals?.length || 0} quotes need approval</p>
          </div>
        </div>
      </motion.div>

      <ManagerKpiCards kpis={data?.kpis} />
      <ManagerCharts data={data} />
      <ManagerDashboardPanels data={data} />
    </div>
  );
}
