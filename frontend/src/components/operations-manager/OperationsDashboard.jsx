import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import OperationsDashboardHeader from './dashboard/OperationsDashboardHeader';
import OperationsExecutionHub from './dashboard/OperationsExecutionHub';
import OperationsKpiCards from './dashboard/OperationsKpiCards';
import OperationsDashboardCharts from './dashboard/OperationsDashboardCharts';

export default function OperationsDashboard() {
  const { data, isLoading, isFetching } = useDashboardQuery('/operations-manager/dashboard');

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {isFetching && (
        <div className="h-0.5 w-full bg-blue-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-blue-500 animate-pulse" />
        </div>
      )}

      <OperationsDashboardHeader />

      <OperationsExecutionHub kpis={data?.kpis} hubStats={data?.hubStats} />

      <OperationsKpiCards
        kpis={data?.kpis}
        kpiTrends={data?.kpiTrends}
        sparklines={data?.sparklines}
        loading={isLoading}
      />

      <OperationsDashboardCharts
        branchStats={data?.branchStats}
        bookingsByStatus={data?.bookingsByStatus}
        todaySchedule={data?.todaySchedule}
      />
    </div>
  );
}
