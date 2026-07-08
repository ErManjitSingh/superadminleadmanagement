import { Link } from 'react-router-dom';
import { Lock, MessageCircle } from 'lucide-react';

export default function FeatureUpgradePrompt({
  title = 'WhatsApp API',
  description = 'This module is not included in your current plan. Upgrade to unlock WhatsApp Leads, templates, and messaging.',
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <MessageCircle className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-bold text-content-primary">{title} not available</h1>
      <p className="mt-2 max-w-md text-sm text-content-muted">{description}</p>
      <Link
        to="/settings/subscription"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
      >
        <Lock className="h-4 w-4" />
        Upgrade plan
      </Link>
    </div>
  );
}
