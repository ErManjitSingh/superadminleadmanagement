import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DashboardPanel from './DashboardPanel';

const COLORS = ['#3B82F6', '#25D366', '#8B5CF6', '#F97316', '#94A3B8', '#22C55E', '#EC4899'];

const SOURCE_LABELS = {
  website: 'Website',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  walk_in: 'Walk-in',
  walkin: 'Walk-in',
  phone: 'Phone',
  email: 'Email',
  social: 'Social Media',
  other: 'Other',
};

function formatSourceName(name) {
  const key = String(name || 'other').toLowerCase().replace(/\s+/g, '_');
  return SOURCE_LABELS[key] || name || 'Other';
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-subtle bg-surface px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-content-primary">{item.name}</p>
      <p className="text-content-muted">{item.value} leads ({item.payload.pct}%)</p>
    </div>
  );
}

export default function LeadSourceChart({ data = [] }) {
  const chartData = data.map((item) => ({
    name: formatSourceName(item.name),
    value: item.value,
    pct: item.pct,
  }));

  if (!chartData.length) {
    return (
      <DashboardPanel title="Leads by Source" subtitle="Acquisition channels">
        <p className="text-sm text-content-muted py-8 text-center">No source data yet</p>
      </DashboardPanel>
    );
  }

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <DashboardPanel title="Leads by Source" subtitle="Where your leads come from" className="h-full">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-[180px] h-[180px] shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-2xl font-bold text-content-primary metric-tabular">{total}</p>
            <p className="text-[10px] text-content-muted">Total</p>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {chartData.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2.5"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-sm text-content-secondary flex-1 truncate">{item.name}</span>
              <span className="text-sm font-bold text-content-primary metric-tabular">{item.pct}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardPanel>
  );
}
