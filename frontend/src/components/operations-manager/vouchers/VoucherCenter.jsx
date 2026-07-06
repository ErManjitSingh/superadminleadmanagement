import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ticket, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import VoucherCompactCard from './VoucherCompactCard';
import {
  fetchBookingExecution,
  generateAllVouchers,
  generateTravelKit,
  generateVoucher,
} from '../../../services/operationsVoucherApi';

const SLOT_TYPES = ['hotel', 'transport', 'activity', 'flight', 'travel_kit'];

export default function VoucherCenter({ bookingId, booking: bookingProp, showTimeline = false, TimelineComponent = null }) {
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

  const slots = useMemo(
    () => SLOT_TYPES.map((type) => ({
      type,
      voucher: activeVouchers.find((v) => v.type === type) || null,
    })),
    [activeVouchers],
  );

  const runAction = async (key, fn) => {
    setActionLoading(key);
    try {
      await fn();
      load();
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = (type) => {
    if (type === 'travel_kit') {
      runAction('kit', () => generateTravelKit(bookingId));
      return;
    }
    const index = 0;
    runAction(type, () => generateVoucher(bookingId, { type: type === 'transport' ? 'transport' : type, assignmentIndex: index }));
  };

  if (loading && !execution) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div id="voucher-center" className="space-y-4 scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black text-lg flex items-center gap-2 text-content-primary">
            <Ticket className="w-5 h-5 text-violet-600" />
            Voucher Center
          </h3>
          <p className="text-sm text-content-muted mt-0.5">Generate, send and track all trip vouchers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-xl gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
            disabled={!!actionLoading}
            onClick={() => runAction('all', () => generateAllVouchers(bookingId))}
          >
            {actionLoading === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate All
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-2"
            disabled={!!actionLoading}
            onClick={() => runAction('kit', () => generateTravelKit(bookingId))}
          >
            {actionLoading === 'kit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
            Travel Kit PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin snap-x snap-mandatory">
        <div className="flex gap-3 w-max min-w-full pr-2">
          {slots.map(({ type, voucher }) => (
            <VoucherCompactCard
              key={type}
              type={type}
              voucher={voucher}
              booking={booking}
              generating={actionLoading === type}
              onGenerate={() => (voucher?.pdfUrl || voucher?.htmlUrl)
                ? window.open(voucher.pdfUrl || voucher.htmlUrl, '_blank')
                : handleGenerate(type)}
            />
          ))}
        </div>
      </div>

      {showTimeline && TimelineComponent}
    </div>
  );
}
