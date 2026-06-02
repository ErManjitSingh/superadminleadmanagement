import { Suspense } from 'react';

export default function RouteFallback({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-content-muted text-sm">
      {label}
    </div>
  );
}

export function withSuspense(node, label) {
  return <Suspense fallback={<RouteFallback label={label} />}>{node}</Suspense>;
}
