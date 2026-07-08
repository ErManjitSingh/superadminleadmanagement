import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenantFeatures } from '../context/TenantContext';
import { isFeatureEnabled } from '../lib/featureFlags';

export default function FeatureUpgradeBanner({ featureKey = 'whatsapp', label = 'WhatsApp API' }) {
  const { user } = useAuth();
  const features = useTenantFeatures();

  if (user?.role !== 'admin') return null;
  if (isFeatureEnabled(features, featureKey)) return null;

  return (
    <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <MessageCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <strong>{label}</strong> is not on your plan.
          </span>
        </div>
        <Link
          to="/settings/subscription"
          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          Upgrade plan
        </Link>
      </div>
    </div>
  );
}
