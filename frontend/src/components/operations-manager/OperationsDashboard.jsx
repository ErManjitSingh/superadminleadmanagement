import { useDashboardQuery } from '../../features/dashboard/hooks/useDashboardQuery';
import OperationsDashboardHeader from './dashboard/OperationsDashboardHeader';
import OperationsExecutionHub from './dashboard/OperationsExecutionHub';
import OperationsKpiCards from './dashboard/OperationsKpiCards';
import NewBookingsPanel from './dashboard/NewBookingsPanel';
import OperationsPerformanceSection from './dashboard/OperationsPerformanceSection';
import OperationsRightRail from './dashboard/OperationsRightRail';
import OperationsDashboardPanels from './dashboard/OperationsDashboardPanels';

export default function OperationsDashboard() {
  const { data, isLoading, isFetching, isError, error, refetch } = useDashboardQuery('/operations-manager/dashboard');

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center max-w-lg mx-auto mt-16">
        <p className="font-semibold text-rose-800 mb-1">Dashboard could not load</p>
        <p className="text-sm text-rose-600 mb-4">{error?.response?.data?.message || error?.message || 'Please try again.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {isFetching && (
        <div className="h-0.5 w-full bg-violet-500/30 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-violet-500 animate-pulse" />
        </div>
      )}

      <OperationsDashboardHeader />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-5 min-w-0">
          <OperationsExecutionHub kpis={data?.kpis} hubStats={data?.hubStats} />

          <OperationsKpiCards
            kpis={data?.kpis}
            kpiTrends={data?.kpiTrends}
            sparklines={data?.sparklines}
            loading={isLoading}
          />

          <NewBookingsPanel bookings={data?.newBookings || data?.recentBookings || []} />

          <OperationsPerformanceSection
            weeklyPerformance={data?.weeklyPerformance}
            topDestinations={data?.topDestinations}
          />

          <OperationsDashboardPanels data={data} />
        </div>

        <aside className="xl:sticky xl:top-4">
          <OperationsRightRail
            scheduleEvents={data?.scheduleEvents}
            alerts={data?.alerts}
          />
        </aside>
      </div>
    </div>
  );
}
