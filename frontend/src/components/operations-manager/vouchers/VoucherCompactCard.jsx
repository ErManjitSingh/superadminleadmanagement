import { useState } from 'react';
import {
  Eye, Loader2, Mail, MessageCircle, RefreshCw, Sparkles, MapPin, Calendar,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { VOUCHER_STATUS_CONFIG, VENDOR_STATUS_CONFIG } from '../constants';
import { getVoucherTypeImage } from '../bookings/bookingDetailUtils';
import VoucherSendModal from './VoucherSendModal';
import { previewVoucherPdf, regenerateVoucher } from '../../../services/operationsVoucherApi';
import { formatDate } from '../operationsUtils';

export default function VoucherCompactCard({
  type,
  meta,
  voucher,
  booking,
  onGenerate,
  generating,
  onRefresh,
}) {
  const [sendChannel, setSendChannel] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const payload = voucher?.payload || {};
  const Icon = meta?.icon;
  const statusCfg = voucher
    ? (VOUCHER_STATUS_CONFIG[voucher.status] || VOUCHER_STATUS_CONFIG.issued)
    : { label: 'Not Generated', className: 'bg-amber-500/15 text-amber-700' };

  const title = (() => {
    if (!voucher) {
      if (type === 'hotel') return booking?.hotels?.[0]?.hotelName || 'Assign Hotel';
      return booking?.transport?.[0]?.vehicleType?.replace(/_/g, ' ') || 'Assign Cab';
    }
    if (type === 'hotel') return payload.hotelName || 'Hotel';
    return payload.vehicleDisplayName || payload.vehicleName || payload.vehicleType?.replace(/_/g, ' ') || 'Cab';
  })();

  const subtitle = type === 'hotel'
    ? (payload.roomType || payload.address || booking?.destination)
    : (payload.driverName ? `Driver: ${payload.driverName}` : payload.pickupLocation || booking?.destination);

  const image = voucher?.coverImage || payload.image || getVoucherTypeImage(type);
  const canSend = voucher && ['hotel', 'transport'].includes(type);

  const handleView = async () => {
    if (!voucher?._id) return;
    setPreviewing(true);
    try {
      await previewVoucherPdf(voucher._id);
    } finally {
      setPreviewing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!voucher?._id) return;
    setRegenerating(true);
    try {
      const updated = await regenerateVoucher(voucher._id);
      await onRefresh?.();
      if (updated?._id) {
        await previewVoucherPdf(updated._id);
      }
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <article className={cn(
        'relative overflow-hidden rounded-2xl border border-subtle bg-surface shadow-lg',
        meta?.ring && `ring-1 ${meta.ring}`,
      )}
      >
        <div className={cn('relative h-32 bg-gradient-to-br text-white', meta?.gradient || 'from-violet-600 to-indigo-700')}>
          <img src={image} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="relative flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {Icon && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">{meta?.label}</p>
                  {voucher?.voucherNumber && (
                    <p className="font-mono text-[11px] font-bold opacity-95">{voucher.voucherNumber}</p>
                  )}
                </div>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm', statusCfg.className)}>
                {statusCfg.label}
              </span>
            </div>
            <div>
              <h4 className="text-lg font-black leading-tight line-clamp-1">{title}</h4>
              {subtitle && <p className="text-xs opacity-90 mt-0.5 line-clamp-1">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-surface-muted/60 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-content-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Destination
              </p>
              <p className="font-semibold text-content-primary mt-0.5 truncate">{booking?.destination || '—'}</p>
            </div>
            <div className="rounded-xl bg-surface-muted/60 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-content-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Travel
              </p>
              <p className="font-semibold text-content-primary mt-0.5 truncate">
                {booking?.travelDate ? formatDate(booking.travelDate) : '—'}
              </p>
            </div>
          </div>

          {voucher?.vendorStatus && canSend && (
            <span className={cn(
              'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold',
              (VENDOR_STATUS_CONFIG[voucher.vendorStatus] || VENDOR_STATUS_CONFIG.pending).className,
            )}
            >
              Vendor: {(VENDOR_STATUS_CONFIG[voucher.vendorStatus] || VENDOR_STATUS_CONFIG.pending).label}
            </span>
          )}

          {voucher ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 min-w-[80px] h-9 rounded-xl text-xs gap-1"
                disabled={previewing || regenerating}
                onClick={handleView}
              >
                {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                View PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl text-xs gap-1 px-3"
                disabled={regenerating || previewing}
                onClick={handleRegenerate}
              >
                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Regen
              </Button>
              {canSend && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl text-xs gap-1 text-emerald-700 border-emerald-200 px-3"
                    onClick={() => setSendChannel('whatsapp')}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl text-xs gap-1 px-3"
                    onClick={() => setSendChannel('email')}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              className={cn('w-full h-10 rounded-xl text-sm font-bold gap-2 text-white bg-gradient-to-r', meta?.gradient || 'from-violet-600 to-indigo-600')}
              disabled={generating}
              onClick={onGenerate}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Voucher
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
