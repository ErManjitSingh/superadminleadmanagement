import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ExternalLink, Loader2, Calendar, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLeadBooking } from '../../services/bookingPaymentsApi';
import { formatINR, formatDate } from '../operations-manager/operationsUtils';

const OPS_ROLES = ['operations_manager', 'admin'];

export default function LeadConvertedBanner({ status, leadId }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'converted' || !leadId) {
      setBooking(null);
      return;
    }
    setLoading(true);
    getLeadBooking(leadId)
      .then((res) => setBooking(res.booking))
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [status, leadId]);

  if (status !== 'converted') return null;

  const canOpenBooking = OPS_ROLES.includes(user?.role);
  const remaining = booking?.remainingBalance ?? booking?.pendingAmount ?? 0;

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 dark:border-emerald-800/40 overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-500/25">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              Converted! This lead has been successfully converted into a booking.
            </p>
            {loading ? (
              <p className="text-xs text-emerald-700/70 mt-2 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading booking details…
              </p>
            ) : booking ? (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-emerald-700/70 font-semibold uppercase tracking-wide">Booking ID</p>
                  <p className="font-mono font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">{booking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-emerald-700/70 font-semibold uppercase tracking-wide flex items-center gap-1"><Wallet className="w-3 h-3" /> Advance</p>
                  <p className="font-bold text-emerald-800 dark:text-emerald-200 mt-0.5 tabular-nums">{formatINR(booking.advanceReceived)}</p>
                </div>
                <div>
                  <p className="text-amber-700/80 font-semibold uppercase tracking-wide">Remaining</p>
                  <p className="font-bold text-amber-700 dark:text-amber-400 mt-0.5 tabular-nums">{formatINR(remaining)}</p>
                </div>
                <div>
                  <p className="text-emerald-700/70 font-semibold uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" /> Travel</p>
                  <p className="font-medium text-emerald-900 dark:text-emerald-100 mt-0.5">{formatDate(booking.travelDate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                Booking is being processed. Refresh if details do not appear.
              </p>
            )}
          </div>
        </div>

        {booking && canOpenBooking && (
          <Link
            to={`/operations-manager/booking/${booking._id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-colors shrink-0"
          >
            Open Booking
            <ExternalLink className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
