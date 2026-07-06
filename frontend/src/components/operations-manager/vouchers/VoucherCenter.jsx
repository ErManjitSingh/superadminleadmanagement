import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ticket, Sparkles, Loader2, Hotel, Car } from 'lucide-react';
import { Button } from '../../ui/button';
import VoucherCompactCard from './VoucherCompactCard';
import {
  fetchBookingExecution,
  generateAllVouchers,
  generateVoucher,
} from '../../../services/operationsVoucherApi';
import { useDataRefresh } from '../../../hooks/useDataRefresh';

const SLOT_TYPES = ['hotel', 'transport'];

const SLOT_META = {
  hotel: {
    label: 'Hotel Voucher',
    icon: Hotel,
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    accent: 'text-violet-600',
    ring: 'ring-violet-500/20',
  },
  transport: {
    label: 'Cab Voucher',
    icon: Car,
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
    accent: 'text-sky-600',
    ring: 'ring-sky-500/20',
  },
};

function normalizeVoucherType(type) {
  return type === 'cab' ? 'transport' : type;
}

function pickActiveVoucher(activeVouchers, type) {
  const slotType = normalizeVoucherType(type);
  return activeVouchers
    .filter((v) => normalizeVoucherType(v.type) === slotType && v.isActive !== false)
    .sort((a, b) => (b.version || 0) - (a.version || 0))[0] || null;
}

function mergeVoucherIntoExecution(execution, voucher) {
  if (!execution || !voucher) return execution;
  const slotType = normalizeVoucherType(voucher.type);
  const normalizedNew = { ...voucher, type: slotType, isActive: true };
  const activeVouchers = [
    ...(execution.activeVouchers || []).filter(
      (v) => normalizeVoucherType(v.type) !== slotType,
    ),
    normalizedNew,
  ];
  const vouchers = [
    ...(execution.vouchers || []).map((v) => (
      normalizeVoucherType(v.type) === slotType && v.isActive !== false
        ? { ...v, isActive: false }
        : v
    )),
    normalizedNew,
  ];
  return { ...execution, activeVouchers, vouchers };
}

export default function VoucherCenter({
  bookingId,
  booking: bookingProp,
  execution: executionProp,
  onExecutionChange,
  showTimeline = false,
  TimelineComponent = null,
}) {
  const [localExecution, setLocalExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const execution = executionProp ?? localExecution;

  const commitExecution = useCallback((data) => {
    setLocalExecution(data);
    onExecutionChange?.(data);
  }, [onExecutionChange]);

  const load = useCallback((silent = false) => {
    if (!bookingId) return Promise.resolve();
    if (!silent) setLoading(true);
    return fetchBookingExecution(bookingId)
      .then((data) => {
        commitExecution(data);
        return data;
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [bookingId, commitExecution]);

  useEffect(() => {
    if (!executionProp && bookingId) load();
  }, [bookingId, executionProp]); // eslint-disable-line react-hooks/exhaustive-deps

  useDataRefresh(
    ['operations', `booking:${bookingId}`],
    () => load(true),
    !executionProp,
    400,
  );

  const patchVoucher = useCallback((voucher) => {
    const base = executionProp ?? localExecution;
    if (!base || !voucher) return;
    commitExecution(mergeVoucherIntoExecution(base, voucher));
  }, [commitExecution, executionProp, localExecution]);

  const booking = execution?.booking || bookingProp;
  const activeVouchers = execution?.activeVouchers || [];

  const slots = useMemo(
    () => SLOT_TYPES.map((type) => ({
      type,
      meta: SLOT_META[type],
      voucher: pickActiveVoucher(activeVouchers, type),
    })),
    [activeVouchers],
  );

  const runAction = async (key, fn) => {
    setActionLoading(key);
    try {
      const result = await fn();
      if (result) {
        const list = Array.isArray(result) ? result : [result];
        list.filter(Boolean).forEach(patchVoucher);
      }
      if (!executionProp) await load(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerate = (type) => {
    const index = 0;
    runAction(type, () => generateVoucher(bookingId, {
      type: type === 'transport' ? 'transport' : type,
      assignmentIndex: index,
    }));
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
          <p className="text-sm text-content-muted mt-0.5">Hotel & cab vouchers — generate, send & track partners</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="rounded-xl gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
            disabled={!!actionLoading}
            onClick={() => runAction('all', () => generateAllVouchers(bookingId))}
          >
            {actionLoading === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slots.map(({ type, meta, voucher }) => (
          <VoucherCompactCard
            key={type}
            type={type}
            meta={meta}
            voucher={voucher}
            booking={booking}
            generating={actionLoading === type}
            onRefresh={() => load(true)}
            onGenerate={() => handleGenerate(type)}
            onVoucherPatched={patchVoucher}
          />
        ))}
      </div>

      {showTimeline && TimelineComponent}
    </div>
  );
}
