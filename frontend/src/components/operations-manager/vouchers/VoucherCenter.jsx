import { useCallback, useEffect, useState } from 'react';
import { Ticket, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import VoucherCard from './VoucherCard';
import TripProgressBar from './TripProgressBar';
import ExecutionTimeline from './ExecutionTimeline';
import {
  fetchBookingExecution,
  generateAllVouchers,
  generateTravelKit,
  generateVoucher,
} from '../../../services/operationsVoucherApi';

export default function VoucherCenter({ bookingId, booking: bookingProp }) {
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(() => {
    if (!bookingId) return;
    setLoading(true);
    fetchBookingExecution(bookingId)
      .then(setExecution)
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const booking = execution?.booking || bookingProp;
  const activeVouchers = execution?.activeVouchers || [];

  const byType = (type) => activeVouchers.filter((v) => v.type === type);

  const runAction = async (key, fn) => {
    setActionLoading(key);
    try {
      await fn();
      load();
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !execution) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div id="voucher-center" className="space-y-6 scroll-mt-24">
      {execution?.progress && <TripProgressBar progress={execution.progress} />}

      <div className="rounded-3xl border border-indigo-500/15 bg-gradient-to-r from-indigo-600/5 via-violet-500/5 to-sky-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-xl flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            Voucher Center
          </h3>
          <p className="text-sm text-content-muted mt-1">
            Generate, send and track all trip vouchers from one place
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="teal"
            className="rounded-xl gap-2"
            disabled={!!actionLoading}
            onClick={() => runAction('all', () => generateAllVouchers(bookingId))}
          >
            {actionLoading === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate All
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-2 border-indigo-300 text-indigo-700"
            disabled={!!actionLoading}
            onClick={() => runAction('kit', () => generateTravelKit(bookingId))}
          >
            {actionLoading === 'kit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            Travel Kit PDF
          </Button>
        </div>
      </div>

      {activeVouchers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-indigo-300/50 p-10 text-center bg-white/40 dark:bg-slate-900/30">
          <Ticket className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <p className="font-semibold text-content-primary">No vouchers yet</p>
          <p className="text-sm text-content-muted mt-1 mb-4">Assign hotels & transport, then generate vouchers.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(booking?.hotels || []).map((_, i) => (
              <Button
                key={`h-${i}`}
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => runAction(`h-${i}`, () => generateVoucher(bookingId, { type: 'hotel', assignmentIndex: i }))}
              >
                Hotel #{i + 1}
              </Button>
            ))}
            {(booking?.transport || []).map((_, i) => (
              <Button
                key={`t-${i}`}
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => runAction(`t-${i}`, () => generateVoucher(bookingId, { type: 'transport', assignmentIndex: i }))}
              >
                Cab #{i + 1}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {byType('hotel').length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-violet-600">Hotel Vouchers</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {byType('hotel').map((v) => (
                  <VoucherCard key={v._id} voucher={v} booking={booking} onUpdated={load} />
                ))}
              </div>
            </section>
          )}
          {byType('transport').length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-sky-600">Cab Vouchers</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {byType('transport').map((v) => (
                  <VoucherCard key={v._id} voucher={v} booking={booking} onUpdated={load} />
                ))}
              </div>
            </section>
          )}
          {byType('activity').length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-rose-600">Activity Vouchers</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {byType('activity').map((v) => (
                  <VoucherCard key={v._id} voucher={v} booking={booking} onUpdated={load} />
                ))}
              </div>
            </section>
          )}
          {byType('flight').length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">Flight Vouchers</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {byType('flight').map((v) => (
                  <VoucherCard key={v._id} voucher={v} booking={booking} onUpdated={load} />
                ))}
              </div>
            </section>
          )}
          {byType('travel_kit').length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600">Customer Travel Kits</h4>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {byType('travel_kit').map((v) => (
                  <VoucherCard key={v._id} voucher={v} booking={booking} onUpdated={load} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {execution?.timeline && <ExecutionTimeline events={execution.timeline} />}
    </div>
  );
}
