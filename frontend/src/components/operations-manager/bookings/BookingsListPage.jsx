import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ClipboardList } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import OperationsDataTable from '../ui/OperationsDataTable';
import OperationsSearchBar from '../ui/OperationsSearchBar';
import { formatINR, formatDate, formatPax } from '../operationsUtils';
import { CONFIRMATION_CONFIG } from '../constants';
import { cn } from '../../../lib/utils';

const PAGE_META = {
  pending: { title: 'Pending Bookings', desc: 'New confirmed sales awaiting operations setup' },
  confirmed: { title: 'Confirmed Bookings', desc: 'Hotels & transport confirmed — ready for departure' },
  active: { title: 'Active Trips', desc: 'Guests currently on trip — monitor execution' },
  completed: { title: 'Completed Trips', desc: 'Successfully fulfilled travel bookings' },
};

export default function BookingsListPage() {
  const navigate = useNavigate();
  const { status } = useParams();
  const meta = PAGE_META[status] || PAGE_META.pending;
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    API.get('/operations-manager/bookings', { params: { status, search: search || undefined, limit: 50 } })
      .then((r) => setBookings(r.data?.data || r.data || []))
      .finally(() => setLoading(false));
  }, [status, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const columns = useMemo(() => [
    {
      key: 'bookingNumber',
      header: 'Booking #',
      render: (b) => (
        <span className="font-mono text-sm font-bold text-teal-600">{b.bookingNumber}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) => (
        <div>
          <p className="font-medium">{b.customerName}</p>
          <p className="text-xs text-content-muted">{b.customerPhone}</p>
        </div>
      ),
    },
    { key: 'destination', header: 'Destination' },
    {
      key: 'package',
      header: 'Package',
      className: 'max-w-[160px] truncate text-content-secondary',
      render: (b) => b.packageName || '—',
    },
    {
      key: 'travel',
      header: 'Travel',
      className: 'whitespace-nowrap text-xs text-content-muted',
      render: (b) => formatDate(b.travelDate || b.travelStart),
    },
    {
      key: 'pax',
      header: 'Pax',
      className: 'text-center',
      render: (b) => formatPax(b),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (b) => (
        <span className="font-bold tabular-nums">{formatINR(b.totalAmount ?? b.amount)}</span>
      ),
    },
    {
      key: 'hotel',
      header: 'Hotel',
      render: (b) => (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', CONFIRMATION_CONFIG[b.hotelConfirmation]?.className)}>
          {CONFIRMATION_CONFIG[b.hotelConfirmation]?.label}
        </span>
      ),
    },
    {
      key: 'cab',
      header: 'Cab',
      render: (b) => (
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-md', CONFIRMATION_CONFIG[b.cabConfirmation]?.className)}>
          {CONFIRMATION_CONFIG[b.cabConfirmation]?.label}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <BookingStatusBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      render: (b) => (
        <Link to={`/operations-manager/booking/${b._id}`} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 gap-1 opacity-70 group-hover:opacity-100 rounded-xl">
            <Eye className="w-3.5 h-3.5" /> View
          </Button>
        </Link>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={meta.title}
        description={meta.desc}
        breadcrumbs={['Operations', 'Bookings', meta.title]}
      />

      <OperationsSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search bookings by customer, destination, booking #..."
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <OperationsDataTable
          columns={columns}
          data={bookings}
          loading={loading}
          emptyIcon={ClipboardList}
          emptyTitle="No bookings in this list"
          emptyDescription="Bookings will appear here once leads are converted and payments confirmed."
          footer={`Showing ${bookings.length} booking${bookings.length === 1 ? '' : 's'}`}
          onRowClick={(b) => navigate(`/operations-manager/booking/${b._id}`)}
        />
      </motion.div>
    </div>
  );
}
