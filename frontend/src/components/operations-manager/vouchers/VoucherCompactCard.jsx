import { useState } from 'react';
import {
  Eye, Loader2, Mail, MessageCircle, RefreshCw, Sparkles, MapPin, Calendar, ChevronRight,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { VOUCHER_STATUS_CONFIG, VENDOR_STATUS_CONFIG } from '../constants';
import VoucherSendModal from './VoucherSendModal';
import { previewVoucherPdf, regenerateVoucher, generateVoucher } from '../../../services/operationsVoucherApi';
import { formatDate } from '../operationsUtils';
import { toast } from '../../../context/ToastContext';

export default function VoucherCompactCard({
  type,
  meta,
  voucher,
  booking,
  assignmentIndex = 0,
  hotelAssignment = null,
  onGenerate,
  generating,
  onRefresh,
  onVoucherPatched,
  isLast = false,
}) {
  const [sendChannel, setSendChannel] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const payload = voucher?.payload || {};
  const Icon = meta?.icon;
  const statusCfg = voucher
    ? (VOUCHER_STATUS_CONFIG[voucher.status] || VOUCHER_STATUS_CONFIG.issued)
    : { label: 'Pending', className: 'bg-amber-500/15 text-amber-700' };

  const hotelFromBooking = hotelAssignment || booking?.hotels?.[assignmentIndex];
  const ready = !!voucher;

  const title = (() => {
    if (!voucher) {
      if (type === 'hotel') return hotelFromBooking?.hotelName || hotelFromBooking?.name || 'Hotel not assigned';
      return booking?.transport?.[0]?.vehicleType?.replace(/_/g, ' ') || 'Cab not assigned';
    }
    if (type === 'hotel') return payload.hotelName || 'Hotel';
    return payload.vehicleDisplayName || payload.vehicleName || payload.vehicleType?.replace(/_/g, ' ') || 'Cab';
  })();

  const details = type === 'hotel'
    ? [
        hotelFromBooking?.day ? `Day ${hotelFromBooking.day}` : null,
        payload.roomType || hotelFromBooking?.roomType,
        payload.mealPlan || hotelFromBooking?.mealPlan,
        payload.address || hotelFromBooking?.destination || booking?.destination,
      ].filter(Boolean)
    : [
        payload.driverName ? `Driver: ${payload.driverName}` : null,
        payload.pickupLocation || booking?.destination,
        payload.vehicleNumber ? `Vehicle ${payload.vehicleNumber}` : null,
      ].filter(Boolean);

  const canSend = voucher && ['hotel', 'transport'].includes(type);
  const vendorCfg = voucher?.vendorStatus
    ? (VENDOR_STATUS_CONFIG[voucher.vendorStatus] || VENDOR_STATUS_CONFIG.pending)
    : null;

  const handleView = async () => {
    if (!voucher?._id) return;
    setPreviewing(true);
    try {
      await previewVoucherPdf(voucher._id);
    } catch (err) {
      toast.error(err?.message || 'Could not open voucher PDF');
    } finally {
      setPreviewing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!voucher?._id && !booking?._id) return;
    setRegenerating(true);
    try {
      let updated = null;
      if (voucher?._id) {
        try {
          updated = await regenerateVoucher(voucher._id);
        } catch {
          updated = null;
        }
      }
      if (!updated?._id && booking?._id) {
        updated = await generateVoucher(booking._id, {
          type: type === 'transport' ? 'transport' : type,
          assignmentIndex,
        });
      }
      if (updated?._id) {
        onVoucherPatched?.(updated);
        try {
          await previewVoucherPdf(updated._id);
        } catch {
          /* optional */
        }
        toast.success('Voucher regenerated');
      } else {
        toast.error('Could not regenerate voucher');
      }
      await onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not regenerate voucher');
    } finally {
      setRegenerating(false);
    }
  };

  const busy = previewing || regenerating || generating;

  return (
    <>
      <article
        className={cn(
          'group flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 px-4 py-3.5 transition-colors',
          'hover:bg-slate-50/80 dark:hover:bg-white/[0.03]',
          !isLast && 'border-b border-subtle',
          !ready && 'bg-amber-50/30 dark:bg-amber-950/10',
        )}
      >
        {/* Icon + identity */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm',
              'bg-gradient-to-br',
              meta?.gradient || 'from-violet-600 to-indigo-700',
            )}
          >
            {Icon ? <Icon className="h-5 w-5" strokeWidth={2} /> : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
                {meta?.label}
              </p>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', statusCfg.className)}>
                {statusCfg.label}
              </span>
              {vendorCfg && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', vendorCfg.className)}>
                  Vendor: {vendorCfg.label}
                </span>
              )}
            </div>

            <h4 className="mt-0.5 text-sm font-bold text-content-primary truncate capitalize">
              {title}
            </h4>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-content-muted">
              {voucher?.voucherNumber && (
                <span className="font-mono font-semibold text-content-secondary">
                  {voucher.voucherNumber}
                  {voucher.version > 1 ? ` · v${voucher.version}` : ''}
                </span>
              )}
              {details.slice(0, 3).map((d) => (
                <span key={d} className="truncate max-w-[180px]">{d}</span>
              ))}
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {booking?.destination || '—'}
              </span>
              {booking?.travelDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {formatDate(booking.travelDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end shrink-0 pl-14 sm:pl-0">
          {ready ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs gap-1.5 font-semibold px-3"
                disabled={busy}
                onClick={handleView}
              >
                {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                View
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs gap-1 px-2.5"
                disabled={busy}
                onClick={handleRegenerate}
                title="Regenerate PDF"
              >
                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </Button>
              {canSend && (
                <>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg text-xs gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                    disabled={busy}
                    onClick={() => setSendChannel('whatsapp')}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs gap-1 px-2.5"
                    disabled={busy}
                    onClick={() => setSendChannel('email')}
                    title="Send Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button
              size="sm"
              className={cn(
                'h-8 rounded-lg text-xs font-bold gap-1.5 text-white bg-gradient-to-r px-3',
                meta?.gradient || 'from-violet-600 to-indigo-600',
              )}
              disabled={busy}
              onClick={onGenerate}
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {type === 'transport' ? 'Generate Cab Voucher' : 'Generate Voucher'}
              <ChevronRight className="w-3.5 h-3.5 opacity-80" />
            </Button>
          )}
        </div>
      </article>

      <VoucherSendModal
        open={!!sendChannel}
        channel={sendChannel}
        type={type}
        voucher={voucher}
        booking={booking}
        onClose={() => setSendChannel(null)}
        onSent={onRefresh}
      />
    </>
  );
}
