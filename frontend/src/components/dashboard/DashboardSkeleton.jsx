export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl bg-surface-elevated" />
      <div className="h-36 rounded-2xl bg-surface-elevated" />
      <div className="h-72 rounded-2xl bg-surface-elevated" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-2xl bg-surface-elevated" />
        <div className="h-80 rounded-2xl bg-surface-elevated" />
      </div>
      <div className="h-64 rounded-2xl bg-surface-elevated" />
    </div>
  );
}
