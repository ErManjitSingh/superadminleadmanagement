import { Link } from 'react-router-dom';
import {
  ArrowLeft, Printer, Download, MoreHorizontal, MapPin, Users, User, Calendar, CheckCircle2, Circle, Hotel, Car,
} from 'lucide-react';
import { Button } from '../../ui/button';
import BookingStatusBadge from './BookingStatusBadge';
import { formatINR, formatDate, formatPax, formatTravelRange } from '../operationsUtils';
import { destinationTags, getDestinationImage } from './bookingDetailUtils';
import { cn } from '../../../lib/utils';

export function BookingDetailHeader({ booking, onPrint }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <Link
          to="/operations-manager/bookings/pending"
          className="mt-1 p-2.5 rounded-xl border border-subtle hover:bg-surface-elevated transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-content-primary tracking-tight">
              {booking.bookingNumber}
            </h1>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="text-xs text-content-muted mt-1">
            Created {formatDate(booking.createdAt)} · {booking.customerName}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={onPrint}>
          <Printer className="w-3.5 h-3.5" /> Print
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function BookingPackageHero({ booking, quoteLink }) {
  const tags = destinationTags(booking.destination);
  const image = booking.coverImage || booking.quotationPreview?.meta?.coverImage || getDestinationImage(booking.destination);
  const amount = booking.totalAmount ?? booking.amount ?? 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-subtle bg-surface shadow-sm">
      <div className="grid lg:grid-cols-[280px_1fr_auto] gap-0">
        <div className="relative h-48 lg:h-full min-h-[12rem] lg:min-h-[220px]">
          <img src={image} alt={booking.packageName || booking.destination} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />
        </div>
        <div className="p-5 sm:p-6 flex flex-col justify-center min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-content-primary">
            {booking.packageName || `${tags[0] || booking.destination} Package`}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MetaItem icon={Calendar} label="Travel Date" value={formatTravelRange(booking)} />
            <MetaItem icon={Users} label="Travelers" value={`${booking.adults || 0} Adults + ${booking.children || 0} Child`} />
            <MetaItem icon={User} label="Executive" value={booking.executiveName || '—'} />
            <MetaItem icon={MapPin} label="Branch" value={booking.branchName || 'Head Office'} />
          </div>
        </div>
        <div className="border-t lg:border-t-0 lg:border-l border-subtle p-5 sm:p-6 flex flex-col justify-center bg-violet-500/5 min-w-[200px]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-content-muted">Total Package Cost</p>
          <p className="text-2xl sm:text-3xl font-black text-violet-600 tabular-nums mt-1">{formatINR(amount)}</p>
          {quoteLink && (
            <a href={quoteLink} className="mt-3 text-xs font-semibold text-violet-600 hover:underline">
              View Quotation →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function BookingPaymentOverview({ summary, nextDue }) {
  if (!summary) return null;
  const progress = Math.min(100, Math.max(0, summary.paymentProgress || 0));
  const statusLabel = { pending: 'Pending', partial: 'Partial', paid: 'Completed', overdue: 'Overdue' };

  const cards = [
    {
      label: 'Payment Progress',
      value: `${progress}%`,
      sub: `${formatINR(summary.totalPaid)} / ${formatINR(summary.packageCost)}`,
      tone: 'violet',
      progress,
    },
    { label: 'Advance Received', value: formatINR(summary.advanceReceived), tone: 'emerald' },
    { label: 'Remaining Balance', value: formatINR(summary.remainingBalance), tone: 'rose' },
    {
      label: 'Next Payment Due',
      value: nextDue ? formatINR(nextDue.amount) : '—',
      sub: nextDue?.date ? `Before ${formatDate(nextDue.date)}` : null,
      tone: 'sky',
    },
    { label: 'Payment Status', value: statusLabel[summary.paymentStatus] || summary.paymentStatus, tone: 'amber' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-subtle bg-surface p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-content-muted">{card.label}</p>
          <p className={cn(
            'mt-1 text-lg font-black tabular-nums',
            card.tone === 'emerald' && 'text-emerald-600',
            card.tone === 'rose' && 'text-rose-600',
            card.tone === 'sky' && 'text-sky-600',
            card.tone === 'amber' && 'text-amber-600',
            card.tone === 'violet' && 'text-violet-600',
            !card.tone && 'text-content-primary',
          )}
          >
            {card.value}
          </p>
          {card.sub && <p className="text-[11px] text-content-muted mt-0.5">{card.sub}</p>}
          {card.progress != null && (
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${card.progress}%` }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function BookingProgressStepper({ steps }) {
  return (
    <div className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-4">Booking Progress</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-start gap-2 sm:flex-col sm:items-center sm:text-center">
            <div className="flex items-center sm:w-full">
              {i > 0 && <div className="hidden sm:block h-px flex-1 bg-subtle" />}
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2',
                  step.state === 'done' && 'border-violet-600 bg-violet-600 text-white',
                  step.state === 'current' && 'border-violet-500 bg-violet-500/15 text-violet-600 ring-2 ring-violet-500/30',
                  step.state === 'pending' && 'border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-800',
                )}
              >
                {step.state === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-current" />}
              </div>
              {i < steps.length - 1 && <div className="hidden sm:block h-px flex-1 bg-subtle" />}
            </div>
            <div className="min-w-0 sm:px-1">
              <p className="text-xs font-semibold text-content-primary leading-tight">{step.label}</p>
              <p className={cn(
                'text-[10px] font-bold mt-0.5 capitalize',
                step.state === 'done' && 'text-violet-600',
                step.state === 'current' && 'text-violet-500',
                step.state === 'pending' && 'text-content-muted',
              )}
              >
                {step.state === 'done' ? 'Completed' : step.state === 'current' ? 'In Progress' : 'Pending'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingInfoColumns({ booking }) {
  const hotel = booking.hotels?.[0] || {};
  const transport = booking.transport?.[0] || {};

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <InfoCard icon={Hotel} title="Hotel Details" color="violet">
        <InfoRow label="Hotel" value={hotel.hotelName || '—'} />
        <InfoRow label="Location" value={hotel.destination || booking.destination} />
        <InfoRow label="Check In" value={formatDate(hotel.checkIn || booking.travelDate)} />
        <InfoRow label="Check Out" value={formatDate(hotel.checkOut || booking.returnDate)} />
        <InfoRow label="Room Type" value={hotel.roomType || '—'} />
        <InfoRow label="Meal Plan" value={hotel.mealPlan || booking.mealPlan || '—'} />
      </InfoCard>
      <InfoCard icon={Car} title="Transport Details" color="sky">
        <InfoRow label="Vehicle" value={transport.vehicleType?.replace(/_/g, ' ') || '—'} />
        <InfoRow label="Plate No." value={transport.vehicleNumber || '—'} />
        <InfoRow label="Driver" value={transport.driverName || '—'} />
        <InfoRow label="Driver Phone" value={transport.driverPhone || '—'} />
        <InfoRow label="Pickup" value={transport.pickupLocation || '—'} />
        <InfoRow label="Drop" value={transport.dropLocation || '—'} />
      </InfoCard>
      <InfoCard icon={User} title="Customer Details" color="emerald">
        <InfoRow label="Name" value={booking.customerName} />
        <InfoRow label="Phone" value={booking.customerPhone || '—'} />
        <InfoRow label="Email" value={booking.customerEmail || '—'} />
        <InfoRow label="Destination" value={booking.destination} />
        <InfoRow label="Travelers" value={formatPax(booking)} />
        <InfoRow label="ID Proof" value={booking.idProofStatus || 'Pending'} />
      </InfoCard>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-content-muted flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="mt-0.5 font-medium text-content-primary text-sm">{value}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, color, children }) {
  const ring = {
    violet: 'from-violet-500/10 border-violet-500/20',
    sky: 'from-sky-500/10 border-sky-500/20',
    emerald: 'from-emerald-500/10 border-emerald-500/20',
  };
  return (
    <div className={cn('rounded-2xl border bg-gradient-to-br to-transparent p-5 shadow-sm', ring[color])}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/60 shadow-sm">
          <Icon className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="font-bold text-content-primary">{title}</h3>
      </div>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-3 text-sm border-b border-subtle/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-content-muted shrink-0">{label}</dt>
      <dd className="font-medium text-content-primary text-right truncate">{value || '—'}</dd>
    </div>
  );
}
