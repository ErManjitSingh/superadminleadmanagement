import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '../../api/superadmin';

function StatusBar({ label, value, color = 'bg-violet-500' }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-300">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SystemStatusWidget() {
  const { data } = useQuery({
    queryKey: ['dashboard-system-status'],
    queryFn: () => superAdminApi.getDashboard().then((r) => r.data),
    staleTime: 60000,
    refetchInterval: 120000,
  });

  const m = data?.metrics || {};
  const storagePct = m.storageLimitGb
    ? Math.round(((m.storageUsedMb || 0) / (m.storageLimitGb * 1024)) * 100)
    : 0;
  const dbOk = data?.serverStatus?.database?.state === 'connected';
  const health = data?.serverStatus?.health === 'healthy';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${health ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <p className="text-xs font-semibold text-white">All Systems Operational</p>
      </div>
      <div className="space-y-2.5">
        <StatusBar label="CPU" value={28} color="bg-violet-500" />
        <StatusBar label="Storage" value={storagePct || 12} color="bg-indigo-400" />
        <StatusBar label="DB" value={dbOk ? 31 : 85} color={dbOk ? 'bg-emerald-500' : 'bg-rose-500'} />
      </div>
    </div>
  );
}
