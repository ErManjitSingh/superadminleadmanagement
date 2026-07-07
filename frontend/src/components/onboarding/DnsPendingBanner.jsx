import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Globe } from 'lucide-react';
import API from '../../api/axios';
import { APP_PLATFORM_DOMAIN } from '../../config/branding';

export default function DnsPendingBanner() {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    API.get('/company-settings', { skipSuccessToast: true, skipErrorToast: true })
      .then((res) => {
        const c = res.data?.company || res.data;
        if (c?.domainType === 'custom' && c?.primaryDomain && !c?.domainVerified) {
          setPending(c);
        }
      })
      .catch(() => {});
  }, []);

  if (!pending) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <p className="flex items-center gap-2 font-semibold text-amber-950">
            <AlertTriangle className="h-4 w-4" />
            Custom domain DNS pending
          </p>
          <p className="mt-0.5 text-sm text-amber-900/80">
            Update DNS for <span className="font-mono font-medium">{pending.primaryDomain}</span> to go live.
            Until then use <span className="font-mono">{pending.subdomain}.{APP_PLATFORM_DOMAIN}</span>.
          </p>
        </div>
      </div>
      <Link
        to="/setup-dns"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500"
      >
        Complete DNS setup
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
