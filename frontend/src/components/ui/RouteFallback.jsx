import { Suspense } from 'react';

export default function RouteFallback({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p>{label}</p>
      </div>
    </div>
  );
}

export function withSuspense(node, label) {
  return <Suspense fallback={<RouteFallback label={label} />}>{node}</Suspense>;
}
