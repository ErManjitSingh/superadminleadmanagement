import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Filter, ExternalLink } from 'lucide-react';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import VoucherCard from './VoucherCard';
import { fetchVouchers, fetchVoucherAnalytics } from '../../../services/operationsVoucherApi';
import { cn } from '../../../lib/utils';

const TYPE_TABS = [
  { value: '', label: 'All Vouchers' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'transport', label: 'Cab' },
  { value: 'activity', label: 'Activity' },
  { value: 'flight', label: 'Flight' },
  { value: 'travel_kit', label: 'Travel Kits' },
];

function AnalyticsWidget({ label, value, accent }) {
  return (
    <div className={cn(
      'rounded-2xl border p-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm',
      'shadow-sm border-indigo-500/10',
    )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">{label}</p>
      <p className={cn('text-2xl font-black mt-1 tabular-nums', accent)}>{value ?? 0}</p>
    </div>
  );
}

export default function VouchersPage({ typeFilter: initialType = '' }) {
  const [vouchers, setVouchers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = typeFilter ? { type: typeFilter === 'cab' ? 'transport' : typeFilter } : {};
    Promise.all([
      fetchVouchers(params),
      fetchVoucherAnalytics(),
    ]).then(([v, a]) => {
      setVouchers(v || []);
      setAnalytics(a);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [typeFilter]);

  const title = useMemo(() => {
    const tab = TYPE_TABS.find((t) => t.value === typeFilter);
    return tab?.label || 'All Vouchers';
  }, [typeFilter]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Voucher Center"
        description={title}
        breadcrumbs={['Operations', 'Vouchers', title]}
      />

      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          <AnalyticsWidget label="Generated Today" value={analytics.generatedToday} accent="text-indigo-600" />
          <AnalyticsWidget label="Pending Confirmations" value={analytics.pendingConfirmations} accent="text-amber-600" />
          <AnalyticsWidget label="Rejected" value={analytics.rejectedVouchers} accent="text-rose-600" />
          <AnalyticsWidget label="Hotel Confirmed" value={analytics.hotelConfirmations} accent="text-emerald-600" />
          <AnalyticsWidget label="Cab Confirmed" value={analytics.cabConfirmations} accent="text-sky-600" />
          <AnalyticsWidget label="WhatsApp Sent" value={analytics.whatsappDeliveries} accent="text-green-600" />
          <AnalyticsWidget label="Email Sent" value={analytics.emailDeliveries} accent="text-violet-600" />
          <AnalyticsWidget label="Ready To Travel" value={analytics.tripsReadyToTravel} accent="text-teal-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-content-muted" />
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTypeFilter(tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all',
              typeFilter === tab.value
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'bg-surface border border-subtle text-content-muted hover:border-indigo-300',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-indigo-300/40 p-12 text-center">
          <Ticket className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <p className="font-semibold">No vouchers in this category</p>
          <p className="text-sm text-content-muted mt-1">Open a booking to generate vouchers from the execution hub.</p>
          <Link to="/operations-manager/trips/active">
            <Button variant="teal" className="rounded-xl mt-4 gap-2">
              <ExternalLink className="w-4 h-4" /> View Active Trips
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {vouchers.map((v) => (
            <div key={v._id} className="space-y-2">
              <VoucherCard
                voucher={v}
                booking={typeof v.booking === 'object' ? v.booking : { customerName: v.customerName }}
                onUpdated={load}
              />
              {v.booking?._id && (
                <Link
                  to={`/operations-manager/booking/${v.booking._id}`}
                  className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1 px-1"
                >
                  Open booking <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
