import { Link } from 'react-router-dom';
import { Calendar, Phone, Users } from 'lucide-react';
import TablePagination from '../ui/TablePagination';

function formatCreated(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatShort(iso, withYear = false) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: withYear ? '2-digit' : undefined,
  });
}

function travelRange(start, end) {
  if (!start && !end) return 'Dates not set';
  if (!end) return formatShort(start, true);
  return `${formatShort(start)} – ${formatShort(end, true)}`;
}

function daysAgoLabel(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function tookLabel(days) {
  if (days == null) return '';
  if (days === 0) return 'Same day';
  if (days === 1) return 'Took 1 day';
  return `Took ${days} days`;
}

function inr(amount) {
  return `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;
}

function cardOf(lead) {
  return lead.conversionCard || {};
}

function JourneyChip({ label, days }) {
  if (days == null) return null;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="rounded-md bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">{label}</span>
      <span className="rounded-md bg-violet-100 px-1.5 py-0.5 font-semibold text-violet-700">{tookLabel(days)}</span>
    </div>
  );
}

function ConvertedLeadCard({ lead, onOpen, bookingTo }) {
  const card = cardOf(lead);
  const salesBy = card.salesBy || lead.assignedTo?.name || lead.createdBy?.name || 'Unassigned';
  const destination = card.destination || lead.destination || 'Destination not set';
  const adults = card.adults ?? lead.adults ?? 0;
  const children = card.children ?? lead.children ?? 0;
  const rooms = card.rooms || 0;
  const source = (lead.sourceLabel || lead.sourceShort || lead.source || 'Lead').toString();
  const left = card.daysLeft;
  const past = left != null && left < 0;
  const statusTone = card.fullyPaid
    ? 'bg-emerald-50 text-emerald-700'
    : card.bookingStatusLabel === 'Confirmed'
      ? 'bg-sky-50 text-sky-700'
      : 'bg-orange-50 text-orange-600';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[210px_210px_minmax(180px,1fr)_minmax(210px,1.1fr)_220px] xl:items-start">
        <button type="button" onClick={() => onOpen?.(lead)} className="space-y-2 text-left">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lead arrived</p>
            <p className="text-sm font-semibold text-slate-800">{formatCreated(lead.createdAt) || '—'}</p>
            <p className="text-xs text-slate-400">{daysAgoLabel(lead.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Converted</p>
            <p className="text-sm font-semibold text-slate-800">{formatCreated(card.convertedAt) || '—'}</p>
            {card.convertedAt && <p className="text-xs text-slate-400">{daysAgoLabel(card.convertedAt)}</p>}
          </div>
        </button>

        <div className="space-y-2">
          <span className="inline-flex rounded-md bg-violet-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-600">
            {source}
          </span>
          <p className="text-sm text-slate-500">
            Sales by: <span className="font-semibold text-sky-600">{salesBy}</span>
          </p>
          <JourneyChip label="Lead → Booking" days={card.leadToBookingDays} />
          <JourneyChip label="Assigned → Booking" days={card.assignedToBookingDays} />
        </div>

        <button type="button" onClick={() => onOpen?.(lead)} className="text-left">
          <p className="text-[15px] font-semibold text-slate-900">{lead.name || 'Unnamed lead'}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Phone className="h-3.5 w-3.5" />
            {lead.phone || 'No phone'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Users className="h-3 w-3" />
              {adults} Adults{children > 0 ? ` · ${children} Children` : ''}
            </span>
            {rooms > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {rooms} Room{rooms === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </button>

        <div>
          <p className="text-sm text-slate-500">
            Going To: <span className="font-semibold uppercase text-slate-800">{destination}</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {travelRange(card.travelDate || lead.travelDate, card.returnDate || lead.returnDate)}
            {card.nights != null && card.days != null && (
              <span className="font-semibold text-slate-700">
                {card.nights}N/{card.days}D
              </span>
            )}
          </p>
          {left != null && (
            <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${past ? 'bg-slate-200 text-slate-600' : 'bg-orange-400 text-white'}`}>
              {past ? `${Math.abs(left)} days ago` : left === 0 ? 'Today' : `${left} days left`}
            </span>
          )}
        </div>

        <div className="xl:text-right">
          <div className="flex items-center gap-2 xl:justify-end">
            <span className="text-sm font-bold text-orange-500">ID: {lead.leadId || '—'}</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusTone}`}>
              {card.bookingStatusLabel || 'Pending'}
            </span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400">Payment Progress</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 xl:ml-auto xl:w-36">
            <div
              className={`h-full rounded-full ${card.fullyPaid ? 'bg-emerald-500' : 'bg-violet-500'}`}
              style={{ width: `${card.paymentProgress || 0}%` }}
            />
          </div>
          {card.fullyPaid ? (
            <p className="mt-1 text-sm font-semibold text-emerald-600">Fully paid</p>
          ) : (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {inr(card.totalPaid)} / {inr(card.totalAmount)}
              </p>
              {card.pendingAmount > 0 && (
                <p className="text-xs text-slate-500">
                  Next: {inr(card.pendingAmount)}
                  {card.nextDueDate ? ` by ${formatShort(card.nextDueDate, true)}` : ''}
                </p>
              )}
            </>
          )}
          {card.overdue && <p className="text-xs font-bold text-red-500">Overdue</p>}
          {card.bookingId && bookingTo ? (
            <Link to={bookingTo(lead)} className="mt-1 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-700">
              Open booking →
            </Link>
          ) : (
            <button type="button" onClick={() => onOpen?.(lead)} className="mt-1 text-sm font-semibold text-violet-600">
              Open lead →
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ConvertedLeadCards({
  leads,
  loading,
  onOpen,
  bookingTo,
  pagination,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400 shadow-sm">
        Loading converted leads...
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-slate-400 shadow-sm">
        No converted leads yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <ConvertedLeadCard key={lead._id} lead={lead} onOpen={onOpen} bookingTo={bookingTo} />
      ))}
      {pagination && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <TablePagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={pagination.pageCount}
            total={pagination.total}
            hasMore={pagination.hasMore}
            totalLabel="converted leads"
            onPageChange={(pageIndex) => pagination.onPaginationChange((prev) => ({ ...prev, pageIndex }))}
            onPageSizeChange={(pageSize) => pagination.onPaginationChange({ pageIndex: 0, pageSize })}
          />
        </div>
      )}
    </div>
  );
}
