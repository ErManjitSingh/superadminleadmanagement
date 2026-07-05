import { useState } from 'react';
import {
  Hotel, Car, Compass, Plane, BookOpen, Loader2,
  Eye, Download, Mail, MessageCircle, RefreshCw, UserPlus,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';
import { VOUCHER_STATUS_CONFIG, VENDOR_STATUS_CONFIG } from '../constants';
import { formatDate } from '../operationsUtils';
import {
  regenerateVoucher,
  sendVoucherEmail,
  sendVoucherWhatsApp,
  downloadVoucherPdf,
} from '../../../services/operationsVoucherApi';

const TYPE_META = {
  hotel: { icon: Hotel, label: 'Hotel Voucher', gradient: 'from-violet-600/10 to-indigo-500/10' },
  transport: { icon: Car, label: 'Cab Voucher', gradient: 'from-sky-600/10 to-cyan-500/10' },
  activity: { icon: Compass, label: 'Activity Voucher', gradient: 'from-rose-600/10 to-orange-500/10' },
  flight: { icon: Plane, label: 'Flight Voucher', gradient: 'from-blue-600/10 to-indigo-500/10' },
  travel_kit: { icon: BookOpen, label: 'Customer Travel Kit', gradient: 'from-emerald-600/10 to-teal-500/10' },
  master: { icon: BookOpen, label: 'Master Voucher', gradient: 'from-purple-600/10 to-violet-500/10' },
};

function DetailRow({ label, value }) {
  if (!value || value === '—') return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-content-muted">{label}</p>
      <p className="text-sm font-semibold text-content-primary mt-0.5">{value}</p>
    </div>
  );
}

export default function VoucherCard({ voucher, booking, onUpdated }) {
  const [loading, setLoading] = useState(null);
  const meta = TYPE_META[voucher.type] || TYPE_META.master;
  const Icon = meta.icon;
  const payload = voucher.payload || {};
  const statusCfg = VOUCHER_STATUS_CONFIG[voucher.status] || VOUCHER_STATUS_CONFIG.issued;
  const vendorCfg = VENDOR_STATUS_CONFIG[voucher.vendorStatus] || VENDOR_STATUS_CONFIG.pending;

  const run = async (key, fn) => {
    setLoading(key);
    try {
      await fn();
      onUpdated?.();
    } finally {
      setLoading(null);
    }
  };

  const previewUrl = voucher.pdfUrl || voucher.htmlUrl;

  const fields = (() => {
    if (voucher.type === 'hotel') {
      return [
        ['Hotel', payload.hotelName],
        ['Room Type', payload.roomType],
        ['Meal Plan', payload.mealPlan],
        ['Check In', formatDate(payload.checkIn)],
        ['Check Out', formatDate(payload.checkOut)],
        ['Guests', booking ? `${booking.adults || 0}A / ${booking.children || 0}C` : null],
      ];
    }
    if (voucher.type === 'transport') {
      return [
        ['Vehicle Type', (payload.vehicleType || '').replace(/_/g, ' ')],
        ['Vehicle', payload.vehicleName || payload.vehicleNumber],
        ['Driver', payload.driverName],
        ['Driver Phone', payload.driverPhone],
        ['Pickup', payload.pickupLocation],
        ['Drop', payload.dropLocation],
        ['Reporting', formatDate(payload.pickupDate)],
      ];
    }
    if (voucher.type === 'activity') {
      return [
        ['Activity', payload.name],
        ['Location', payload.location],
        ['Vendor', payload.vendorName],
        ['Date', formatDate(payload.scheduledAt)],
        ['Amount', payload.amount != null ? `₹${payload.amount}` : null],
      ];
    }
    if (voucher.type === 'flight') {
      return [
        ['Airline', payload.airline],
        ['PNR', payload.pnr],
        ['Flight', payload.flightNumber],
        ['Departure', formatDate(payload.departure)],
        ['Arrival', formatDate(payload.arrival)],
        ['Passengers', payload.passengers],
      ];
    }
    return [
      ['Customer', voucher.customerName],
      ['Destination', booking?.destination],
      ['Travel', booking ? `${formatDate(booking.travelDate)} – ${formatDate(booking.returnDate)}` : null],
    ];
  })();

  return (
    <div className={cn(
      'rounded-3xl border border-subtle overflow-hidden shadow-lg shadow-indigo-500/5',
      'bg-gradient-to-br backdrop-blur-sm',
      meta.gradient,
    )}
    >
      <div className="p-5 border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-900/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{meta.label}</p>
              <p className="font-mono text-sm font-bold text-content-primary">{voucher.voucherNumber}</p>
              {voucher.version > 1 && <p className="text-[10px] text-content-muted">Version {voucher.version}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg', statusCfg.className)}>
              {statusCfg.label}
            </span>
            {['hotel', 'transport', 'activity'].includes(voucher.type) && (
              <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg', vendorCfg.className)}>
                Vendor: {vendorCfg.label}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-white/30 dark:bg-slate-900/20">
        {fields.map(([label, value]) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      </div>

      <div className="p-4 flex flex-wrap gap-2 bg-white/60 dark:bg-slate-900/50 border-t border-subtle">
        {!voucher.filePath && !previewUrl && (
          <Button
            size="sm"
            variant="teal"
            className="rounded-xl h-8 gap-1"
            disabled={!!loading}
            onClick={() => run('gen', () => regenerateVoucher(voucher._id))}
          >
            {loading === 'gen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Generate
          </Button>
        )}
        {previewUrl && (
          <Button size="sm" variant="outline" className="rounded-xl h-8 gap-1" asChild>
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <Eye className="w-3.5 h-3.5" /> Preview
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl h-8 gap-1"
          disabled={!!loading}
          onClick={() => run('dl', () => downloadVoucherPdf(voucher._id, voucher.fileName))}
        >
          {loading === 'dl' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl h-8 gap-1 text-emerald-700 border-emerald-200"
          disabled={!!loading}
          onClick={() => run('wa', () => sendVoucherWhatsApp(voucher._id, booking?.customerPhone))}
        >
          {loading === 'wa' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
          WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl h-8 gap-1"
          disabled={!!loading}
          onClick={() => run('email', () => sendVoucherEmail(voucher._id, booking?.customerEmail))}
        >
          {loading === 'email' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          Email
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-xl h-8 gap-1"
          disabled={!!loading}
          onClick={() => run('regen', () => regenerateVoucher(voucher._id))}
        >
          {loading === 'regen' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Regenerate
        </Button>
        {voucher.type === 'transport' && (
          <Button size="sm" variant="ghost" className="rounded-xl h-8 gap-1" disabled>
            <UserPlus className="w-3.5 h-3.5" /> Assign Driver
          </Button>
        )}
      </div>
    </div>
  );
}
