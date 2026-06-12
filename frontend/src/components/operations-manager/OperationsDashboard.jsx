import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import PageHeader from '../ui/PageHeader';
import OperationsKpiCards from './dashboard/OperationsKpiCards';
import OperationsDashboardPanels from './dashboard/OperationsDashboardPanels';

export default function OperationsDashboard() {
  const { data, isLoading, isFetching } = useDashboardQuery('/operations-manager/dashboard');

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {isFetching && (
        <div className="h-0.5 w-full bg-teal-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-teal-500 animate-pulse" />
        </div>
      )}
      <PageHeader
        title="Operations Command Center"
        description="Confirmed bookings, vendor fulfillment & trip execution"
        breadcrumbs={['Operations Manager', 'Dashboard']}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-600/10 via-emerald-500/5 to-cyan-500/10 p-6 backdrop-blur-xl"
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Trip Execution Hub
            </div>
            <h2 className="text-xl font-bold text-content-primary">
              {data?.kpis?.pendingBookings} bookings need operations setup
            </h2>
            <p className="text-sm text-content-secondary mt-1">
              {data?.kpis?.hotelConfirmations} hotel · {data?.kpis?.cabConfirmations} cab confirmations pending
            </p>
          </div>
        </div>
      </motion.div>

      <OperationsKpiCards kpis={data?.kpis} />

      {data?.branchStats?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-subtle bg-surface/80 p-5"
        >
          <h3 className="font-bold text-content-primary mb-4">Branch-wise Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.branchStats.map((b) => (
              <div key={String(b._id)} className="p-4 rounded-xl border border-subtle bg-surface-elevated/40">
                <p className="text-xs text-content-muted uppercase">Branch</p>
                <p className="text-lg font-bold text-content-primary mt-1 tabular-nums">{b.count}</p>
                <p className="text-[10px] text-content-muted mt-0.5">bookings</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <OperationsDashboardPanels data={data} />
    </div>
  );
}
