import { motion } from 'framer-motion';
import { Flame, Snowflake, Sun, Crown, Clock, AlertTriangle, UserX, Brain } from 'lucide-react';

const TEMP_ICONS = { hot: Flame, warm: Sun, cold: Snowflake, vip: Crown };
const TEMP_COLORS = {
  hot: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  warm: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
  cold: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
  vip: 'text-violet-600 bg-violet-500/10 border-violet-500/20',
};

export default function EnterpriseKpiStrip({ kpis }) {
  if (!kpis) return null;

  const sla = kpis.sla || {};
  const temps = kpis.temperature || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3"
    >
      <KpiTile
        icon={Brain}
        label="Avg Smart Score"
        value={kpis.avgSmartScore ?? 0}
        tone="brand"
      />
      <KpiTile icon={Crown} label="VIP Leads" value={kpis.vipCount ?? 0} tone="violet" />
      <KpiTile icon={UserX} label="Unassigned" value={kpis.unassigned ?? 0} tone="amber" />
      <KpiTile icon={AlertTriangle} label="SLA Breached" value={sla.breached ?? 0} tone="rose" />
      <KpiTile icon={Clock} label="SLA At Risk" value={sla.atRisk ?? 0} tone="orange" />
      <KpiTile icon={Clock} label="SLA Met" value={sla.met ?? 0} tone="emerald" />

      {temps.map((t) => {
        const Icon = TEMP_ICONS[t.key] || Sun;
        const color = TEMP_COLORS[t.key] || TEMP_COLORS.warm;
        return (
          <div
            key={t.key}
            className={`rounded-2xl border px-4 py-3 ${color}`}
          >
            <Icon className="w-4 h-4 mb-1.5" />
            <p className="text-xl font-bold metric-tabular">{t.count}</p>
            <p className="text-[11px] opacity-80 mt-0.5">{t.label}</p>
          </div>
        );
      })}
    </motion.div>
  );
}

function KpiTile({ icon: Icon, label, value, tone }) {
  const tones = {
    brand: 'border-brand-500/20 bg-brand-500/5 text-brand-700',
    violet: 'border-violet-500/20 bg-violet-500/5 text-violet-700',
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-700',
    rose: 'border-rose-500/20 bg-rose-500/5 text-rose-700',
    orange: 'border-orange-500/20 bg-orange-500/5 text-orange-700',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] || tones.brand}`}>
      <Icon className="w-4 h-4 mb-1.5 opacity-80" />
      <p className="text-xl font-bold metric-tabular">{value}</p>
      <p className="text-[11px] opacity-75 mt-0.5">{label}</p>
    </div>
  );
}
