import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, ShieldCheck } from 'lucide-react';
import API from '../../api/axios';
import { cn } from '../../lib/utils';

export default function OnboardingChecklist({ compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/company-settings/onboarding', { skipSuccessToast: true, skipErrorToast: true })
      .then((r) => setData(r.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data || data.progress?.percent === 100) return null;

  return (
    <div className={cn(
      'rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white',
      compact ? 'p-4' : 'p-5',
    )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Setup Checklist</p>
          <p className="text-xs text-slate-500">{data.progress.completed} of {data.progress.total} complete</p>
        </div>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
          {data.progress.percent}%
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${data.progress.percent}%` }} />
      </div>
      <ul className={cn('space-y-2', compact && 'max-h-40 overflow-auto')}>
        {data.steps.map((step) => (
          <li key={step.key} className="flex items-center gap-2 text-sm">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span className={step.done ? 'text-slate-500 line-through' : 'text-slate-700'}>{step.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrialBanner() {
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/company-settings/onboarding', { skipSuccessToast: true, skipErrorToast: true })
      .then((r) => setData(r.data?.data))
      .catch(() => {});
  }, []);

  if (!data?.trialDaysRemaining && data?.trialDaysRemaining !== 0) return null;
  if (data.trialDaysRemaining <= 0) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-900">
        <Clock className="mr-1.5 inline h-4 w-4" />
        Your trial has ended. <a href="/settings/subscription" className="font-semibold underline">Upgrade your plan</a>
      </div>
    );
  }

  return (
    <div className="border-b border-violet-200 bg-violet-50 px-4 py-2.5 text-center text-sm text-violet-900">
      <ShieldCheck className="mr-1.5 inline h-4 w-4" />
      <strong>{data.trialDaysRemaining} day{data.trialDaysRemaining === 1 ? '' : 's'}</strong> left in your free trial.
      {' '}
      <a href="/settings/subscription" className="font-semibold underline">Upgrade plan</a>
    </div>
  );
}
