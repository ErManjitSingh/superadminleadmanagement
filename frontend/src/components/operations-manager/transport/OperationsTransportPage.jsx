import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Plane } from 'lucide-react';
import API from '../../../api/axios';
import { cn } from '../../../lib/utils';
import TablePagination from '../../ui/TablePagination';
import OperationsDataTable from '../ui/OperationsDataTable';
import TransportInventoryHeader from './TransportInventoryHeader';
import TransportKpiStrip from './TransportKpiStrip';
import TransportFilterBar from './TransportFilterBar';
import TransportBottomPanels from './TransportBottomPanels';
import TransportRowActions, { TransportStatusBadge, VehicleTypeBadge } from './TransportRowActions';
import {
  countActiveTransportFilters,
  exportCabsCsv,
  exportFlightsCsv,
  formatTransportDateTime,
  formatTransportPrice,
  getVehicleThumbClass,
} from './transportListUtils';

const EMPTY_CAB_FILTERS = {
  search: '',
  vehicleType: '',
  pickup: '',
  drop: '',
  status: '',
};

const EMPTY_FLIGHT_FILTERS = {
  search: '',
  status: '',
};

export default function OperationsTransportPage() {
  const [tab, setTab] = useState('cabs');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [fleetOverview, setFleetOverview] = useState([]);
  const [mostUsed, setMostUsed] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    vehicleTypes: [],
    pickups: [],
    drops: [],
    statuses: [],
  });
  const [cabFilters, setCabFilters] = useState(EMPTY_CAB_FILTERS);
  const [flightFilters, setFlightFilters] = useState(EMPTY_FLIGHT_FILTERS);
  const [appliedCabFilters, setAppliedCabFilters] = useState(EMPTY_CAB_FILTERS);
  const [appliedFlightFilters, setAppliedFlightFilters] = useState(EMPTY_FLIGHT_FILTERS);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const appliedFilters = tab === 'cabs' ? appliedCabFilters : appliedFlightFilters;

  const fetchTransport = useCallback(() => {
    setLoading(true);
    const params = {
      tab,
      page: pagination.page,
      limit: pagination.limit,
      search: appliedFilters.search || undefined,
      status: appliedFilters.status || undefined,
    };

    if (tab === 'cabs') {
      Object.assign(params, {
        vehicleType: appliedCabFilters.vehicleType || undefined,
        pickup: appliedCabFilters.pickup || undefined,
        drop: appliedCabFilters.drop || undefined,
      });
    }

    API.get('/operations-manager/transport', { params, skipSuccessToast: true })
      .then((r) => {
        const payload = r.data || {};
        setRows(payload.data || []);
        setSummary(payload.summary || null);
        setFleetOverview(payload.fleetOverview || payload.summary?.fleetOverview || []);
        setMostUsed(payload.mostUsed || payload.summary?.mostUsed || []);
        setFilterOptions(payload.filters || {
          vehicleTypes: [],
          pickups: [],
          drops: [],
          statuses: [],
        });
        setPagination((prev) => ({
          ...prev,
          total: payload.pagination?.total ?? 0,
          totalPages: payload.pagination?.totalPages ?? 1,
        }));
      })
      .finally(() => setLoading(false));
  }, [tab, pagination.page, pagination.limit, appliedCabFilters, appliedFlightFilters]);

  useEffect(() => {
    fetchTransport();
  }, [fetchTransport]);

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const cabColumns = useMemo(() => [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (c) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <div
            className={cn(
              'w-12 h-12 rounded-xl bg-gradient-to-br shrink-0 flex items-center justify-center shadow-sm',
              getVehicleThumbClass(c.displayName),
            )}
          >
            <Car className="w-5 h-5 text-white/90" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-content-primary truncate">{c.displayName}</p>
            <p className="text-xs text-content-muted font-mono truncate">{c.displayRegistration}</p>
            <p className="text-[11px] text-content-muted truncate">{c.displaySubtitle}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => <VehicleTypeBadge type={c.displayType} />,
    },
    {
      key: 'pickup',
      header: 'Pickup',
      render: (c) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-medium text-content-primary">{c.displayPickup || '—'}</p>
          {c.displayPickupAddress && (
            <p className="text-xs text-content-muted truncate max-w-[180px]">{c.displayPickupAddress}</p>
          )}
          {c.pickupDate && (
            <p className="text-[11px] text-blue-600 mt-0.5">{formatTransportDateTime(c.pickupDate)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'drop',
      header: 'Drop',
      render: (c) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-medium text-content-primary">{c.displayDrop || '—'}</p>
          {c.displayDropAddress && (
            <p className="text-xs text-content-muted truncate max-w-[180px]">{c.displayDropAddress}</p>
          )}
          {c.dropDate && (
            <p className="text-[11px] text-content-muted mt-0.5">{formatTransportDateTime(c.dropDate)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      className: 'text-sm text-content-secondary',
      render: (c) => c.displayCapacity || '—',
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (c) => (
        <div>
          <p className="font-bold text-emerald-600 tabular-nums text-base">
            {formatTransportPrice(c.displayCost)}
          </p>
          <p className="text-[10px] text-content-muted">{c.displayTripType || 'One Way'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <TransportStatusBadge status={c.displayStatus} />,
    },
    {
      key: 'actions',
      header: 'Action',
      headerClassName: 'w-28 text-right',
      className: 'text-right',
      render: (c) => <TransportRowActions />,
    },
  ], []);

  const flightColumns = useMemo(() => [
    {
      key: 'airline',
      header: 'Airline',
      render: (f) => <span className="font-semibold text-content-primary">{f.airline}</span>,
    },
    {
      key: 'flightNumber',
      header: 'Flight',
      className: 'font-mono text-sm',
      render: (f) => f.flightNumber || '—',
    },
    {
      key: 'route',
      header: 'Route',
      render: (f) => (
        <span className="text-sm text-content-secondary">{f.displayRoute || '—'}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (f) => (
        <span className="font-bold tabular-nums text-emerald-600">
          {formatTransportPrice(f.displayCost)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (f) => <TransportStatusBadge status={f.displayStatus} />,
    },
    {
      key: 'actions',
      header: 'Action',
      headerClassName: 'w-28 text-right',
      className: 'text-right',
      render: () => <TransportRowActions />,
    },
  ], []);

  const columns = tab === 'cabs' ? cabColumns : flightColumns;

  const handleApply = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    if (tab === 'cabs') {
      setAppliedCabFilters({ ...cabFilters });
    } else {
      setAppliedFlightFilters({ ...flightFilters });
    }
  };

  const handleReset = () => {
    if (tab === 'cabs') {
      setCabFilters(EMPTY_CAB_FILTERS);
      setAppliedCabFilters(EMPTY_CAB_FILTERS);
    } else {
      setFlightFilters(EMPTY_FLIGHT_FILTERS);
      setAppliedFlightFilters(EMPTY_FLIGHT_FILTERS);
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    if (tab === 'cabs') exportCabsCsv(rows);
    else exportFlightsCsv(rows);
  };

  const headerTotal = tab === 'cabs' ? summary?.totalVehicles : summary?.totalFlights;

  return (
    <div className="space-y-1 pb-8">
      <TransportInventoryHeader total={headerTotal ?? pagination.total} />

      <TransportKpiStrip summary={summary} loading={loading} />

      <TransportFilterBar
        tab={tab}
        onTabChange={handleTabChange}
        filters={tab === 'cabs' ? cabFilters : flightFilters}
        onChange={tab === 'cabs' ? setCabFilters : setFlightFilters}
        onApply={handleApply}
        onReset={handleReset}
        onExport={handleExport}
        vehicleTypes={filterOptions.vehicleTypes}
        pickups={filterOptions.pickups}
        drops={filterOptions.drops}
        statuses={filterOptions.statuses}
        activeCount={countActiveTransportFilters(appliedFilters)}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-subtle/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(13,148,136,0.06)] overflow-hidden"
      >
        <OperationsDataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyIcon={tab === 'cabs' ? Car : Plane}
          emptyTitle={tab === 'cabs' ? 'No cabs in fleet' : 'No flights in inventory'}
          emptyDescription="Transport options will appear here once configured."
          className="border-0 shadow-none rounded-none"
        />

        {!loading && rows.length > 0 && (
          <TablePagination
            className="border-t border-subtle/80 bg-surface-elevated/30"
            pageIndex={pagination.page - 1}
            pageSize={pagination.limit}
            pageCount={pagination.totalPages}
            total={pagination.total}
            totalLabel={tab === 'cabs' ? 'vehicles' : 'flights'}
            showPageNumbers
            onPageChange={(pageIndex) => setPagination((prev) => ({ ...prev, page: pageIndex + 1 }))}
            onPageSizeChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
          />
        )}
      </motion.div>

      {tab === 'cabs' && (
        <TransportBottomPanels fleetOverview={fleetOverview} mostUsed={mostUsed} />
      )}
    </div>
  );
}
