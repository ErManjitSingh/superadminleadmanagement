import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell } from 'lucide-react';
import PageHeader from '../../ui/PageHeader';
import { fetchVouchers } from '../../../services/operationsVoucherApi';
import { cn } from '../../../lib/utils';

export default function OperationsAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVouchers()
      .then((all) => {
        const items = [];
        (all || []).forEach((v) => {
          if (v.vendorStatus === 'rejected') {
            items.push({ id: v._id, type: 'rejected', title: `Vendor rejected ${v.type} voucher`, voucher: v });
          } else if (v.vendorStatus === 'changes_requested') {
            items.push({ id: v._id, type: 'changes', title: `Vendor requested changes`, voucher: v });
          } else if (v.vendorStatus === 'pending' && v.status === 'sent') {
            items.push({ id: v._id, type: 'pending', title: `Awaiting vendor confirmation`, voucher: v });
          }
        });
        setAlerts(items);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Operations Alerts"
        description="Rejected vouchers, pending confirmations and escalations"
        breadcrumbs={['Operations', 'Alerts']}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-12 text-center">
          <Bell className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-emerald-700">All clear — no active alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                'rounded-2xl border p-4 flex items-center justify-between gap-4',
                a.type === 'rejected' ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/50',
              )}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn('w-5 h-5 shrink-0', a.type === 'rejected' ? 'text-rose-600' : 'text-amber-600')} />
                <div>
                  <p className="font-semibold text-sm">{a.title}</p>
                  <p className="text-xs text-content-muted">{a.voucher.voucherNumber} · {a.voucher.customerName}</p>
                </div>
              </div>
              {a.voucher.booking?._id && (
                <Link to={`/operations-manager/booking/${a.voucher.booking._id}`} className="text-xs font-bold text-indigo-600 shrink-0">
                  Resolve
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
