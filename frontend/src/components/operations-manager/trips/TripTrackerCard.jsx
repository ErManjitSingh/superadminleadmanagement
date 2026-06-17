import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Baby,
  Building2,
  Car,
  Clock,
  Eye,
  MapPin,
  MessageCircle,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  getAvatarColor,
  getDestinationFlag,
  getInitials,
} from '../bookings/bookingListUtils';
import { formatTripDate, getTripToneStyles } from './tripTrackerUtils';

function HighlightItem({ icon: Icon, label, value, valueClassName }) {
  return (
    <div className="text-center px-1">
      <div className="flex items-center justify-center gap-1 text-content-muted mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn('text-xs font-bold', valueClassName || 'text-content-primary')}>{value}</p>
    </div>
  );
}

function StatusPill({ label, confirmed }) {
  return (
    <span
      className={cn(
        'text-[11px] font-semibold',
        confirmed ? 'text-emerald-600' : 'text-orange-500'
      )}
    >
      {confirmed ? 'Confirmed' : 'Pending'}
    </span>
  );
}

export default function TripTrackerCard({ trip, index = 0, compact = false }) {
  const tone = trip.displayStatus?.tone || trip.footerTone || 'slate';
  const styles = getTripToneStyles(tone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'rounded-2xl border border-subtle bg-white shadow-sm overflow-hidden flex flex-col',
        compact && 'sm:flex-row sm:items-stretch'
      )}
    >
      <div className={cn('p-5 flex-1', compact && 'sm:flex sm:items-center sm:gap-5')}>
        <div className={cn('flex-1', compact && 'min-w-0')}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <span className={cn('font-mono text-xs font-bold px-2.5 py-1 rounded-lg border', styles.bookingPill)}>
              {trip.bookingNumber}
            </span>
            <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg border', styles.badge)}>
              {trip.displayStatus?.label || trip.status}
            </span>
          </div>

          <div className="flex items-start gap-3 mb-4">
            <div className={cn('w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0', getAvatarColor(trip.customerName))}>
              {getInitials(trip.customerName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-content-primary truncate">{trip.customerName}</p>
              <div className="flex items-center gap-1.5 text-sm text-content-muted mt-0.5">
                <span>{trip.customerPhone || '—'}</span>
                {trip.customerPhone && (
                  <a
                    href={`https://wa.me/${String(trip.customerPhone).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-emerald-600 hover:text-emerald-500"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-content-secondary mt-1">
                <MapPin className="w-3.5 h-3.5 text-content-muted shrink-0" />
                <span>{getDestinationFlag(trip.destination)} {trip.destination}</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-content-primary min-w-0">
              <span className="whitespace-nowrap">{formatTripDate(trip.travelDate)}</span>
              <ArrowRight className="w-4 h-4 text-content-muted shrink-0" />
              <span className="whitespace-nowrap">{formatTripDate(trip.returnDate)}</span>
            </div>
            {trip.durationLabel && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-content-secondary whitespace-nowrap shrink-0">
                {trip.durationLabel}
              </span>
            )}
          </div>

          {!compact && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-3">
                Trip Highlights
              </p>
              <div className="grid grid-cols-5 gap-2">
                <HighlightItem icon={User} label="Adults" value={trip.adults ?? 0} />
                <HighlightItem icon={Baby} label="Children" value={trip.children ?? 0} />
                <HighlightItem
                  icon={Building2}
                  label="Hotel"
                  value={<StatusPill confirmed={trip.hotelStatus === 'confirmed'} />}
                />
                <HighlightItem
                  icon={Car}
                  label="Transport"
                  value={<StatusPill confirmed={trip.transportStatus === 'confirmed'} />}
                />
                <HighlightItem
                  icon={Sparkles}
                  label="Activities"
                  value={`${trip.activitiesBooked ?? 0} Booked`}
                  valueClassName="text-emerald-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={cn('border-t px-5 py-3 flex items-center justify-between gap-3', styles.footer, compact && 'sm:border-t-0 sm:border-l sm:min-w-[220px] sm:flex-col sm:justify-center')}>
        <div className={cn('min-w-0', compact && 'text-center')}>
          <p className={cn('flex items-center gap-1.5 text-xs font-semibold', styles.footerText, compact && 'justify-center')}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {trip.footerMessage || '—'}
          </p>
          {trip.footerDateLabel && (
            <p className={cn('text-[11px] mt-0.5', styles.footerText, compact && 'text-center')}>
              {trip.footerDateLabel}
            </p>
          )}
        </div>
        <Link
          to={`/operations-manager/booking/${trip._id}`}
          className={cn(
            'inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white border border-subtle text-sm font-semibold text-content-primary hover:bg-slate-50 shadow-sm transition-colors shrink-0',
            compact && 'w-full justify-center'
          )}
        >
          <Eye className="w-4 h-4" />
          View Details
        </Link>
      </div>
    </motion.div>
  );
}
