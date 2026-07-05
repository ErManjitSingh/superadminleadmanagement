import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ExternalLink } from 'lucide-react';
import PageHeader from '../../ui/PageHeader';
import { fetchVouchers } from '../../../services/operationsVoucherApi';
import { VENDOR_STATUS_CONFIG } from '../constants';
import { formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

export default function VendorConfirmationsPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVouchers()
      .then((all) => setVouchers(
        (all || []).filter((v) => ['hotel', 'transport', 'activity'].includes(v.type)),
      ))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Vendor Confirmations"
        description="Track accept, reject and change requests from hotel, cab and activity partners"
        breadcrumbs={['Operations', 'Vendors', 'Confirmations']}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vouchers.map((v) => {
            const cfg = VENDOR_STATUS_CONFIG[v.vendorStatus] || VENDOR_STATUS_CONFIG.pending;
            return (
              <div key={v._id} className="rounded-3xl border border-subtle p-5 bg-surface/80 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-indigo-600 uppercase">{v.type} · {v.voucherNumber}</p>
                    <p className="font-bold text-lg mt-1">{v.customerName}</p>
                    <p className="text-sm text-content-muted">{v.bookingNumber}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg', cfg.className)}>{cfg.label}</span>
                </div>
                {v.vendorNotes && (
                  <p className="text-sm mt-3 p-3 rounded-xl bg-amber-500/10 text-amber-800">{v.vendorNotes}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-content-muted">
                  <span>Responded: {v.vendorRespondedAt ? formatDate(v.vendorRespondedAt) : '—'}</span>
                  {v.vendorConfirmationUrl && (
                    <a href={v.vendorConfirmationUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold inline-flex items-center gap-1">
                      Vendor link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {v.booking?._id && (
                  <Link to={`/operations-manager/booking/${v.booking._id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 mt-3">
                    <Building2 className="w-3.5 h-3.5" /> Open booking
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
