import { useState } from 'react';
import { Eye, Loader2, Mail, MessageCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { VOUCHER_STATUS_CONFIG, VENDOR_STATUS_CONFIG } from '../constants';
import { getVoucherTypeImage } from '../bookings/bookingDetailUtils';
import VoucherSendModal from './VoucherSendModal';

const TYPE_LABELS = {
  hotel: 'Hotel Voucher',
  transport: 'Cab Voucher',
};

const PLACEHOLDER_TITLES = {
  hotel: 'Hotel Voucher',
  transport: 'Cab Voucher',
};

export default function VoucherCompactCard({ type, voucher, booking, onGenerate, generating, onRefresh }) {
  const [sendChannel, setSendChannel] = useState(null);
  const payload = voucher?.payload || {};
  const statusCfg = voucher
    ? (VOUCHER_STATUS_CONFIG[voucher.status] || VOUCHER_STATUS_CONFIG.issued)
    : { label: 'Pending', className: 'bg-amber-500/15 text-amber-700' };

  const title = (() => {
    if (!voucher) {
      if (type === 'hotel') return booking?.hotels?.[0]?.hotelName || 'Assign Hotel';
      if (type === 'transport') return booking?.transport?.[0]?.vehicleType?.replace(/_/g, ' ') || 'Assign Cab';
      return PLACEHOLDER_TITLES[type] || 'Voucher';
    }
    if (type === 'hotel') return payload.hotelName || 'Hotel';
    if (type === 'transport') return payload.vehicleName || payload.vehicleType?.replace(/_/g, ' ') || 'Cab';
    return 'Voucher';
  })();

  const image = voucher?.coverImage || payload.image || getVoucherTypeImage(type);
  const previewUrl = voucher?.pdfUrl || voucher?.htmlUrl;
  const canSend = voucher && ['hotel', 'transport'].includes(type);

  return (
    <>
      <article className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-subtle bg-surface shadow-sm snap-start">
        <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <span className="absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            {TYPE_LABELS[type] || PLACEHOLDER_TITLES[type]}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-3">
          <p className="text-sm font-bold text-content-primary line-clamp-2 leading-tight min-h-[2.5rem]">{title}</p>
          <span className={cn('mt-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold', statusCfg.className)}>
            {statusCfg.label}
          </span>
          {voucher && canSend && voucher.vendorStatus && (
            <span className={cn('mt-1 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-bold', (VENDOR_STATUS_CONFIG[voucher.vendorStatus] || VENDOR_STATUS_CONFIG.pending).className)}>
              {(VENDOR_STATUS_CONFIG[voucher.vendorStatus] || VENDOR_STATUS_CONFIG.pending).label}
            </span>
          )}
          <div className="mt-auto pt-3 space-y-1.5">
            {voucher && previewUrl ? (
              <>
                <Button size="sm" variant="outline" className="w-full h-8 rounded-lg text-xs gap-1" asChild>
                  <a href={previewUrl} target="_blank" rel="noreferrer">
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                </Button>
                {canSend && (
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg text-[10px] gap-0.5 text-emerald-700 border-emerald-200 px-1"
                      onClick={() => setSendChannel('whatsapp')}
                    >
                      <MessageCircle className="w-3 h-3" /> WA
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 rounded-lg text-[10px] gap-0.5 px-1"
                      onClick={() => setSendChannel('email')}
                    >
                      <Mail className="w-3 h-3" /> Email
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 rounded-lg text-xs"
                disabled={generating}
                onClick={onGenerate}
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : voucher ? 'View' : 'Generate'}
              </Button>
            )}
          </div>
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
