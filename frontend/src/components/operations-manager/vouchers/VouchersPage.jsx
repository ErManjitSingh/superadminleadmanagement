import { useEffect, useMemo, useState } from 'react';
import { Plus, Send, Ticket, ExternalLink } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import VoucherGenerateModal from './VoucherGenerateModal';
import OperationsDataTable from '../ui/OperationsDataTable';
import { VOUCHER_STATUS_CONFIG } from '../constants';
import { formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      API.get('/operations-manager/vouchers'),
      API.get('/operations-manager/bookings'),
    ]).then(([v, b]) => {
      setVouchers(v.data || []);
      setBookings(b.data?.data || b.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async (payload) => {
    await API.post('/operations-manager/vouchers', payload);
    setModalOpen(false);
    fetchData();
  };

  const markSent = async (id) => {
    await API.put(`/operations-manager/vouchers/${id}`, { status: 'sent' });
    fetchData();
  };

  const columns = useMemo(() => [
    {
      key: 'voucherNumber',
      header: 'Voucher #',
      render: (v) => (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-mono text-sm font-bold text-teal-600">{v.voucherNumber}</span>
        </div>
      ),
    },
    { key: 'type', header: 'Type', className: 'capitalize' },
    {
      key: 'title',
      header: 'Title',
      className: 'max-w-[200px] truncate',
      render: (v) => v.details?.title || v.title || '—',
    },
    { key: 'customerName', header: 'Customer' },
    { key: 'bookingNumber', header: 'Booking', className: 'font-mono text-xs' },
    {
      key: 'validPeriod',
      header: 'Valid Period',
      className: 'text-xs text-content-muted whitespace-nowrap',
      render: (v) => `${formatDate(v.details?.validFrom || v.validFrom)} – ${formatDate(v.details?.validUntil || v.validUntil)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => (
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', VOUCHER_STATUS_CONFIG[v.status]?.className)}>
          {VOUCHER_STATUS_CONFIG[v.status]?.label}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (v) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {v.pdfUrl && (
            <a href={v.pdfUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" className="h-8 gap-1 rounded-xl">
                <ExternalLink className="w-3.5 h-3.5" /> PDF
              </Button>
            </a>
          )}
          {v.status !== 'sent' && v.status !== 'redeemed' && (
            <Button size="sm" variant="outline" className="h-8 gap-1 rounded-xl" onClick={() => markSent(v._id)}>
              <Send className="w-3.5 h-3.5" /> Send
            </Button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Voucher Management"
        description="Generate and send hotel, cab & activity vouchers to customers"
        breadcrumbs={['Operations', 'Vouchers']}
        actions={
          <Button variant="teal" className="rounded-xl gap-2" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" /> Generate Voucher
          </Button>
        }
      />

      <OperationsDataTable
        columns={columns}
        data={vouchers}
        loading={loading}
        emptyIcon={Ticket}
        emptyTitle="No vouchers yet"
        emptyDescription="Generate vouchers for confirmed bookings to share with customers."
        footer={vouchers.length ? `${vouchers.length} voucher${vouchers.length === 1 ? '' : 's'}` : undefined}
      />

      <VoucherGenerateModal open={modalOpen} bookings={bookings} onClose={() => setModalOpen(false)} onGenerate={handleGenerate} />
    </div>
  );
}
