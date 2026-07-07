import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import API from '../../api/axios';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TrialExpiryBanner() {
  const [sub, setSub] = useState(null);

  useEffect(() => {
    API.get('/company-settings/subscription', { skipSuccessToast: true, skipErrorToast: true })
      .then((res) => setSub(res.data?.data || null))
      .catch(() => {});
  }, []);

  if (!sub) return null;

  const { status, daysRemaining, trialEndDate, isExpired, showTrialWarning } = sub;
  const show = isExpired || showTrialWarning || status === 'expired';
  if (!show) return null;

  const urgent = isExpired || status === 'expired' || daysRemaining <= 1;
  const daysLabel = isExpired || status === 'expired'
    ? 'Your trial has expired'
    : daysRemaining <= 0
      ? 'Your trial ends today'
      : daysRemaining === 1
        ? 'Your trial ends tomorrow'
        : `Your trial ends in ${daysRemaining} days`;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        urgent
          ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50'
          : 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            urgent ? 'bg-rose-500/15 text-rose-700' : 'bg-amber-500/15 text-amber-700'
          }`}
        >
          {urgent ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>
        <div>
          <p className={`font-semibold ${urgent ? 'text-rose-950' : 'text-amber-950'}`}>{daysLabel}</p>
          <p className={`mt-0.5 text-sm ${urgent ? 'text-rose-900/80' : 'text-amber-900/80'}`}>
            {isExpired || status === 'expired'
              ? 'Upgrade your plan to restore full access to leads, bookings and your team.'
              : `Trial ends ${formatDate(trialEndDate)}. Upgrade now to avoid interruption.`}
            {sub.upgradeRequestPending && (
              <span className="ml-1 font-medium">Upgrade request pending — we will contact you soon.</span>
            )}
          </p>
        </div>
      </div>
      {!sub.upgradeRequestPending && (
        <Link
          to="/settings/subscription"
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${
            urgent ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          Upgrade plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
