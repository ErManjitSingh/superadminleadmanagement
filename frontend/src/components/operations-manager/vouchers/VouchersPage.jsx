import { useEffect, useState } from 'react';
import { Plus, Send, Ticket, ExternalLink } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import VoucherGenerateModal from './VoucherGenerateModal';
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

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-content-muted animate-pulse">Loading vouchers...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-subtle bg-surface-elevated/50">
                {['Voucher #', 'Type', 'Title', 'Customer', 'Booking', 'Valid Period', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase text-content-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {vouchers.map((v) => (
                <tr key={v._id} className="hover:bg-teal-500/[0.03]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-teal-600" />
                      <span className="font-mono text-sm font-bold text-teal-600">{v.voucherNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm capitalize">{v.type}</td>
                  <td className="px-4 py-3.5 text-sm max-w-[200px] truncate">{v.details?.title || v.title || '—'}</td>
                  <td className="px-4 py-3.5 text-sm">{v.customerName}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">{v.bookingNumber}</td>
                  <td className="px-4 py-3.5 text-xs text-content-muted">{formatDate(v.details?.validFrom || v.validFrom)} – {formatDate(v.details?.validUntil || v.validUntil)}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', VOUCHER_STATUS_CONFIG[v.status]?.className)}>{VOUCHER_STATUS_CONFIG[v.status]?.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {v.pdfUrl && (
                        <a href={v.pdfUrl} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg">
                            <ExternalLink className="w-3.5 h-3.5" /> PDF
                          </Button>
                        </a>
                      )}
                      {v.status !== 'sent' && v.status !== 'redeemed' && (
                        <Button size="sm" variant="outline" className="h-8 gap-1 rounded-lg" onClick={() => markSent(v._id)}>
                          <Send className="w-3.5 h-3.5" /> Send
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <VoucherGenerateModal open={modalOpen} bookings={bookings} onClose={() => setModalOpen(false)} onGenerate={handleGenerate} />
    </div>
  );
}
