import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Hotel,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Printer,
  Share2,
  StickyNote,
  Ticket,
  User,
  Users,
  Wallet,
  Pencil,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import { useSidebar } from '../../../context/SidebarContext';
import { formatINR, formatDate, formatPax, formatTravelRange } from '../operationsUtils';
import {
  bookingHasHotels,
  getDestinationImage,
  getExecutiveDisplayName,
} from './bookingDetailUtils';
import { cn } from '../../../lib/utils';

const PRIORITY_STYLES = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-sky-50 text-sky-700 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const TONE_ICON = {
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
};

function SectionCard({ title, action, children, className, bodyClassName }) {
  return (
    <div className={cn('rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-subtle">
          {title ? <h3 className="text-sm font-bold text-content-primary">{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </div>
  );
}

function StatusPill({ children, tone = 'slate' }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    sky: 'bg-sky-100 text-sky-700',
    rose: 'bg-rose-100 text-rose-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold', tones[tone])}>
      {children}
    </span>
  );
}

/* ─── Hero ─────────────────────────────────────────────────── */

export function BookingCommandHero({
  booking,
  summary,
  onPrint,
  onDownloadPdf,
  onEdit,
  onCall,
  onWhatsApp,
  onViewQuote,
}) {
  const image = booking.coverImage
    || booking.quotationPreview?.meta?.coverImage
    || getDestinationImage(booking.destination);
  const total = summary?.packageCost ?? booking.totalAmount ?? 0;
  const paid = summary?.totalPaid ?? booking.totalPaid ?? booking.advanceReceived ?? 0;
  const due = summary?.remainingBalance ?? Math.max(0, total - paid);
  const executive = getExecutiveDisplayName(booking) || '—';
  const opsName = booking.assignedOpsName || booking.operationsManagerName || executive;
  const confirmed = ['confirmed', 'in_progress', 'completed'].includes(booking.status);

  return (
    <div className="rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/operations-manager/bookings/pending"
            className="p-2 rounded-xl border border-subtle hover:bg-slate-50 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">Booking Detail</p>
            <p className="text-sm text-content-secondary truncate">{booking.customerName} · {booking.destination}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={onPrint}>
            <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Print</span>
          </Button>
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={onDownloadPdf}>
            <Share2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Share</span>
          </Button>
          <Button type="button" size="sm" className="rounded-xl gap-1.5 h-9 bg-violet-600 hover:bg-violet-700" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit Booking</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_minmax(220px,260px)] gap-4 p-4 sm:p-5 pt-2">
        <div className="relative h-40 sm:h-44 lg:h-full min-h-[160px] rounded-xl overflow-hidden">
          <img src={image} alt={booking.destination} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {confirmed && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 shadow">
              <CheckCircle2 className="w-3 h-3" /> Booking Confirmed
            </span>
          )}
        </div>

        <div className="min-w-0 flex flex-col justify-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
              {booking.bookingNumber}
            </h1>
            <BookingStatusBadge status={booking.status} />
            {booking.status === 'in_progress' && <StatusPill tone="violet">Active Trip</StatusPill>}
          </div>
          <p className="text-sm font-semibold text-content-secondary flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
            {booking.packageName || booking.destination}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            <MetaChip icon={Calendar} label="Travel Dates" value={formatTravelRange(booking)} />
            <MetaChip icon={Users} label="Travelers" value={formatPax(booking)} />
            <MetaChip icon={User} label="Customer" value={booking.customerName} />
            <MetaChip icon={User} label="Sales Exec" value={executive} />
            <MetaChip icon={User} label="Ops Exec" value={opsName} className="col-span-2 sm:col-span-1" />
          </div>
        </div>

        <div className="rounded-xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-white p-4 flex flex-col justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-content-muted">Total Package Cost</p>
            <p className="text-2xl font-black text-content-primary tabular-nums mt-1">{formatINR(total)}</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-content-muted">Paid Amount</span>
                <span className="font-bold text-emerald-600 tabular-nums">{formatINR(paid)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-content-muted">Due Amount</span>
                <span className="font-bold text-amber-600 tabular-nums">{formatINR(due)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-violet-100">
            <QuickLink icon={Phone} label="Call" onClick={onCall} />
            <QuickLink icon={MessageCircle} label="WhatsApp" onClick={onWhatsApp} />
            <QuickLink icon={Download} label="PDF" onClick={onDownloadPdf} />
            {onViewQuote && <QuickLink icon={FileText} label="Quote" onClick={onViewQuote} />}
            <QuickLink icon={MoreHorizontal} label="More" onClick={onEdit} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaChip({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-content-muted flex items-center gap-1">
        <Icon className="w-3 h-3 shrink-0" /> {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-content-primary truncate">{value || '—'}</p>
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100/80 transition-colors"
    >
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}

/* ─── Progress ─────────────────────────────────────────────── */

export function BookingCommandProgress({ steps = [] }) {
  return (
    <SectionCard title="Booking Progress" bodyClassName="pt-3 pb-4 overflow-x-auto">
      <div className="flex items-start min-w-[640px] sm:min-w-0 gap-0">
        {steps.map((step, i) => (
          <div key={step.key} className="flex-1 min-w-0 flex flex-col items-center text-center px-1">
            <div className="flex items-center w-full mb-2">
              <div className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : step.state === 'pending' ? 'bg-slate-200' : 'bg-emerald-400')} />
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
                  step.state === 'done' && 'bg-emerald-500 border-emerald-500 text-white',
                  step.state === 'current' && 'bg-sky-500 border-sky-500 text-white ring-4 ring-sky-500/20',
                  step.state === 'pending' && 'bg-white border-slate-300 text-slate-400',
                )}
              >
                {step.state === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current" />}
              </div>
              <div className={cn('h-0.5 flex-1', i === steps.length - 1 ? 'bg-transparent' : step.state === 'done' ? 'bg-emerald-400' : 'bg-slate-200')} />
            </div>
            <p className="text-[11px] font-semibold text-content-primary leading-tight">{step.label}</p>
            <p className={cn(
              'text-[10px] font-bold mt-0.5',
              step.state === 'done' && 'text-emerald-600',
              step.state === 'current' && 'text-sky-600',
              step.state === 'pending' && 'text-content-muted',
            )}
            >
              {step.state === 'done' ? 'Done' : step.state === 'current' ? 'In Progress' : 'Pending'}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Action Center ────────────────────────────────────────── */

export function BookingActionCenter({ items = [], onResolveAll }) {
  if (!items.length) return null;
  return (
    <SectionCard
      title="Action Center"
      action={(
        <button type="button" onClick={onResolveAll} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
          Resolve All
        </button>
      )}
      bodyClassName="pt-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn('rounded-xl border p-3.5 flex gap-3', PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.medium)}
          >
            <span className={cn('mt-0.5 w-2.5 h-2.5 rounded-full shrink-0', TONE_ICON[item.tone] || TONE_ICON.amber)} />
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold truncate">{item.title}</p>
                <span className="text-[10px] font-bold uppercase shrink-0 opacity-80">
                  {item.done ? 'Done' : item.priority}
                </span>
              </div>
              <p className="text-xs mt-1 opacity-80 leading-snug">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Detail Grid ──────────────────────────────────────────── */

export function BookingDetailGrid({ booking, onHotelVoucher, onCabManage, onCallHotel, onConfirmCab, confirmingCab }) {
  const hasHotels = bookingHasHotels(booking);
  const hotel = booking.hotels?.[0] || {};
  const cab = booking.transport?.[0] || {};
  const cabConfirmed = booking.cabConfirmation === 'confirmed';
  const cols = hasHotels
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={cn('grid gap-4', cols)}>
      {hasHotels && (
        <DetailCard
          icon={Hotel}
          title="Hotel Details"
          badge={<StatusPill tone={booking.hotelConfirmation === 'confirmed' ? 'emerald' : 'amber'}>{booking.hotelConfirmation === 'confirmed' ? 'Confirmed' : 'Pending'}</StatusPill>}
          accent="violet"
          actions={(
            <>
              <GhostBtn onClick={onCallHotel}>Call Hotel</GhostBtn>
              <GhostBtn onClick={onHotelVoucher}>Voucher</GhostBtn>
              <GhostBtn onClick={onHotelVoucher}>View</GhostBtn>
            </>
          )}
        >
          <Row label="Hotel" value={hotel.hotelName || '—'} />
          <Row label="Category" value={hotel.category || '—'} />
          <Row label="Check-in" value={formatDate(hotel.checkIn || booking.travelDate)} />
          <Row label="Check-out" value={formatDate(hotel.checkOut || booking.returnDate)} />
          <Row label="Room" value={hotel.roomType || '—'} />
          <Row label="Meal Plan" value={hotel.mealPlan || '—'} />
          <Row label="Vendor" value={hotel.vendorName || hotel.destination || '—'} />
        </DetailCard>
      )}

      <DetailCard
        icon={Car}
        title="Cab Details"
        badge={<StatusPill tone={cabConfirmed ? 'emerald' : 'amber'}>{cabConfirmed ? 'Confirmed' : 'Pending'}</StatusPill>}
        accent="sky"
        actions={(
          <>
            {!cabConfirmed && (
              <GhostBtn onClick={onConfirmCab} disabled={confirmingCab}>
                {confirmingCab ? 'Saving…' : 'Mark Confirmed'}
              </GhostBtn>
            )}
            <GhostBtn onClick={onCabManage}>Manage Cab</GhostBtn>
            <GhostBtn onClick={onCabManage}>Change Driver</GhostBtn>
          </>
        )}
      >
        <Row label="Vehicle" value={(cab.vehicleType || '—').replace(/_/g, ' ')} />
        <Row label="Driver" value={cab.driverName || 'Not assigned'} />
        <Row label="Phone" value={cab.driverPhone || '—'} />
        <Row label="Vehicle No." value={cab.vehicleNumber || '—'} />
        <Row label="Pickup" value={cab.pickupLocation || '—'} />
        <Row label="Drop" value={cab.dropLocation || '—'} />
      </DetailCard>

      <DetailCard icon={User} title="Customer Details" accent="emerald" badge={booking.priority === 'high' ? <StatusPill tone="violet">VIP</StatusPill> : null}>
        <Row label="Name" value={booking.customerName} />
        <Row label="Phone" value={booking.customerPhone || '—'} />
        <Row label="Email" value={booking.customerEmail || '—'} />
        <Row label="Destination" value={booking.destination} />
        <Row label="Travelers" value={formatPax(booking)} />
        <Row label="Requests" value={booking.specialRequests || booking.notes || 'None'} />
      </DetailCard>

      <DetailCard
        icon={Building2}
        title="Vendor Info"
        accent="amber"
        actions={<GhostBtn onClick={onCabManage}>View All Vendors</GhostBtn>}
      >
        {hasHotels && (
          <VendorRow
            label="Hotel"
            name={hotel.vendorName || hotel.hotelName || '—'}
            phone={hotel.vendorPhone || hotel.phone || '—'}
          />
        )}
        <VendorRow
          label="Cab"
          name={cab.vendorName || '—'}
          phone={cab.driverPhone || cab.vendorPhone || '—'}
        />
        {!hasHotels && !cab.vendorName && (
          <p className="text-xs text-content-muted py-2">No vendors linked yet</p>
        )}
      </DetailCard>
    </div>
  );
}

function DetailCard({ icon: Icon, title, badge, accent, children, actions }) {
  const accents = {
    violet: 'text-violet-600 bg-violet-50',
    sky: 'text-sky-600 bg-sky-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
  };
  return (
    <div className="rounded-2xl border border-subtle bg-white shadow-sm flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', accents[accent])}>
            <Icon className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-content-primary truncate">{title}</h3>
        </div>
        {badge}
      </div>
      <div className="p-4 space-y-2.5 flex-1">{children}</div>
      {actions && (
        <div className="px-4 py-3 border-t border-subtle flex flex-wrap gap-2 bg-slate-50/60">
          {actions}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-content-muted shrink-0">{label}</span>
      <span className="font-semibold text-content-primary text-right truncate">{value || '—'}</span>
    </div>
  );
}

function VendorRow({ label, name, phone }) {
  return (
    <div className="rounded-xl border border-subtle bg-slate-50/70 p-3 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-content-muted">{label}</p>
      <p className="text-sm font-semibold text-content-primary truncate">{name}</p>
      <p className="text-xs text-content-muted">{phone}</p>
    </div>
  );
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-subtle bg-white hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

/* ─── Right Rail ───────────────────────────────────────────── */

export function BookingPaymentDonut({ summary, onCollect }) {
  const total = summary?.packageCost || 0;
  const paid = summary?.totalPaid || 0;
  const due = summary?.remainingBalance ?? Math.max(0, total - paid);
  const pct = total ? Math.round((paid / total) * 100) : 0;
  const data = [
    { name: 'Paid', value: Math.max(paid, 0.01), color: '#22C55E' },
    { name: 'Due', value: Math.max(due, 0.01), color: '#E2E8F0' },
  ];

  return (
    <SectionCard title="Payment Summary">
      <div className="relative mx-auto w-36 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={46} outerRadius={64} strokeWidth={0} startAngle={90} endAngle={-270}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-black text-content-primary tabular-nums">{pct}%</p>
          <p className="text-[10px] font-semibold text-content-muted">Paid</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-content-muted">Total</span><span className="font-bold tabular-nums">{formatINR(total)}</span></div>
        <div className="flex justify-between"><span className="text-content-muted">Paid</span><span className="font-bold text-emerald-600 tabular-nums">{formatINR(paid)}</span></div>
        <div className="flex justify-between"><span className="text-content-muted">Due</span><span className="font-bold text-amber-600 tabular-nums">{formatINR(due)}</span></div>
      </div>
      {due > 0 && (
        <Button type="button" className="w-full mt-4 rounded-xl bg-amber-500 hover:bg-amber-600 gap-2" onClick={onCollect}>
          <Wallet className="w-4 h-4" /> Collect Payment
        </Button>
      )}
    </SectionCard>
  );
}

export function BookingDocumentCenter({ booking, execution, onOpenQuote, onOpenVouchers, onOpenPdf }) {
  const hasHotels = bookingHasHotels(booking);
  const vouchers = execution?.activeVouchers || [];
  const docs = [
    hasLinkedQuote(booking) && { id: 'quote', label: 'Quotation PDF', meta: booking.quotationReference || 'Ready', onClick: onOpenQuote },
    hasHotels && { id: 'hotel-v', label: 'Hotel Voucher', meta: vouchers.find((v) => v.type === 'hotel') ? 'Generated' : 'Pending', onClick: onOpenVouchers },
    { id: 'cab-v', label: 'Cab Voucher', meta: vouchers.find((v) => v.type === 'transport') ? 'Generated' : 'Pending', onClick: onOpenVouchers },
    { id: 'invoice', label: 'Invoice / Kit', meta: 'PDF', onClick: onOpenPdf },
  ].filter(Boolean);

  return (
    <SectionCard title="Document Center">
      <div className="space-y-2">
        {docs.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={d.onClick}
            className="w-full flex items-center gap-3 rounded-xl border border-subtle px-3 py-2.5 hover:bg-slate-50 text-left transition-colors"
          >
            <span className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-content-primary truncate">{d.label}</span>
              <span className="block text-[11px] text-content-muted">{d.meta}</span>
            </span>
            <Download className="w-4 h-4 text-content-muted shrink-0" />
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

function hasLinkedQuote(booking) {
  return !!(booking?.quotation || booking?.quotationReference);
}

export function BookingCommunicationPanel({ booking, onWhatsApp, onCall, onEmail }) {
  const phone = booking.customerPhone;
  return (
    <SectionCard title="Communication">
      <div className="grid grid-cols-4 gap-2">
        <CommBtn icon={MessageCircle} label="WhatsApp" onClick={onWhatsApp} color="bg-emerald-500" />
        <CommBtn icon={Phone} label="Call" onClick={onCall} color="bg-sky-500" />
        <CommBtn icon={Mail} label="Email" onClick={onEmail} color="bg-violet-500" />
        <CommBtn icon={MessageCircle} label="SMS" onClick={onCall} color="bg-amber-500" />
      </div>
      <p className="text-[11px] text-content-muted mt-3 text-center">
        {phone ? `Contact · ${phone}` : 'No phone on file'}
      </p>
    </SectionCard>
  );
}

function CommBtn({ icon: Icon, label, onClick, color }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 group">
      <span className={cn('w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform', color)}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="text-[10px] font-semibold text-content-secondary">{label}</span>
    </button>
  );
}

/* ─── Feeds ────────────────────────────────────────────────── */

export function BookingFeedsRow({ timelineEvents = [], notes = [], onAddNote }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <SectionCard title="Execution Timeline">
        {!timelineEvents.length ? (
          <p className="text-sm text-content-muted py-6 text-center">No timeline events yet</p>
        ) : (
          <div className="relative space-y-0 max-h-72 overflow-y-auto pr-1">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
            {timelineEvents.slice(0, 12).map((ev, i) => (
              <div key={ev._id || ev.id || i} className="relative flex gap-3 py-2.5 pl-1">
                <span className="relative z-10 w-2.5 h-2.5 mt-1.5 ml-[6px] rounded-full bg-violet-500 ring-4 ring-white shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-content-primary">{ev.title || ev.type || 'Event'}</p>
                  <p className="text-xs text-content-muted mt-0.5">{ev.message || ev.notes || ''}</p>
                  <p className="text-[10px] text-content-muted mt-1">{formatDate(ev.createdAt || ev.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Activity Feed">
        {!timelineEvents.length ? (
          <p className="text-sm text-content-muted py-6 text-center">No recent activity</p>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {timelineEvents.slice(0, 8).map((ev, i) => (
              <div key={`act-${ev._id || i}`} className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <StickyNote className="w-3.5 h-3.5 text-slate-500" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-content-primary">{ev.title || ev.message || 'Activity'}</p>
                  <p className="text-[10px] text-content-muted mt-0.5">{formatDate(ev.createdAt || ev.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Notes"
        action={(
          <button type="button" onClick={onAddNote} className="text-xs font-semibold text-violet-600">
            + Add Note
          </button>
        )}
      >
        {(notes || []).length === 0 ? (
          <div className="py-8 text-center">
            <StickyNote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-content-muted">No internal notes yet</p>
            <button type="button" onClick={onAddNote} className="mt-3 text-xs font-semibold text-violet-600">
              Add first note
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {notes.map((n, i) => (
              <div key={n._id || i} className="rounded-xl bg-slate-50 border border-subtle p-3">
                <p className="text-sm text-content-primary">{n.text || n.note || n}</p>
                <p className="text-[10px] text-content-muted mt-1">{formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ─── Bottom Action Bar ────────────────────────────────────── */

export function BookingCommandFooter({
  onSave,
  onAssignVendor,
  onGenerateVoucher,
  onCollectPayment,
  onDownloadPdf,
  onComplete,
  showPayment = true,
}) {
  const { collapsed, expandedWidth, collapsedWidth } = useSidebar();
  const sidebarOffset = collapsed ? collapsedWidth : expandedWidth;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-subtle bg-white/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(15,23,42,0.08)] lg:left-[var(--ops-sidebar-offset)] lg:transition-[left] lg:duration-300"
      style={{ '--ops-sidebar-offset': `${sidebarOffset}px` }}
    >
      <div className="max-w-[1680px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <FooterBtn variant="outline" onClick={onSave}>Save Draft</FooterBtn>
          <FooterBtn variant="outline" onClick={onAssignVendor}>Assign Vendor</FooterBtn>
          <FooterBtn variant="primary" icon={Ticket} onClick={onGenerateVoucher}>Generate Voucher</FooterBtn>
          {showPayment && (
            <FooterBtn variant="amber" icon={Wallet} onClick={onCollectPayment}>Collect Payment</FooterBtn>
          )}
          <FooterBtn variant="outline" icon={Download} onClick={onDownloadPdf}>Download PDF</FooterBtn>
          <FooterBtn variant="success" icon={CheckCircle2} onClick={onComplete}>Complete Booking</FooterBtn>
        </div>
      </div>
    </div>
  );
}

function FooterBtn({ children, onClick, variant = 'outline', icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors shrink-0',
        variant === 'outline' && 'border border-subtle bg-white text-content-primary hover:bg-slate-50',
        variant === 'primary' && 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-500/25',
        variant === 'amber' && 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
        variant === 'success' && 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}
