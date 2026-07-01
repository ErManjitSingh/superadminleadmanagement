import { Link } from 'react-router-dom';
import { Building2, Home, LifeBuoy, SearchX } from 'lucide-react';
import { APP_PLATFORM_DOMAIN, APP_SALES_EMAIL } from '../config/branding';

export default function TenantNotFoundPage({ reason = 'not_found' }) {
  const messages = {
    not_found: {
      title: 'Workspace Not Found',
      description: 'This company URL does not exist or may have been removed.',
    },
    unavailable: {
      title: 'Workspace Unavailable',
      description: 'This account is suspended, expired, or temporarily unavailable.',
    },
    network: {
      title: 'Connection Problem',
      description: 'We could not reach the server. Please try again.',
    },
  };

  const msg = messages[reason] || messages.not_found;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
          <SearchX className="h-8 w-8 text-violet-200" />
        </div>
        <h1 className="text-2xl font-bold text-white">{msg.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{msg.description}</p>
        <p className="mt-2 text-xs text-white/40">
          Host: {typeof window !== 'undefined' ? window.location.hostname : ''}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={`https://${APP_PLATFORM_DOMAIN}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-900"
          >
            <Home className="h-4 w-4" />
            Go Home
          </a>
          <a
            href={`mailto:${APP_SALES_EMAIL}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10"
          >
            <LifeBuoy className="h-4 w-4" />
            Contact Support
          </a>
        </div>
        <Link
          to="/signup"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-300 hover:text-white"
        >
          <Building2 className="h-4 w-4" />
          Create a new workspace
        </Link>
      </div>
    </div>
  );
}
