export default function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-surface-elevated" />
          <div className="h-4 w-80 rounded-lg bg-surface-elevated" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 rounded-xl bg-surface-elevated" />
          <div className="h-10 w-28 rounded-xl bg-surface-elevated" />
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-surface-elevated" />
        ))}
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-surface-elevated" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-72 rounded-2xl bg-surface-elevated" />
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 h-80 rounded-2xl bg-surface-elevated" />
        <div className="xl:col-span-4 h-80 rounded-2xl bg-surface-elevated" />
      </div>
    </div>
  );
}
