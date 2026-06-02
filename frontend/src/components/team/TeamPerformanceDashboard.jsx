import { motion } from 'framer-motion';
import { Trophy, TrendingUp, PhoneCall, IndianRupee, Medal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from './constants';

const kpiCards = [
  { key: 'teamRevenue', label: 'Team Revenue', icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600', format: formatCurrency, hint: 'Approved package sales' },
  { key: 'teamConversions', label: 'Team Conversions', icon: TrendingUp, gradient: 'from-violet-500 to-purple-600' },
  { key: 'teamFollowUps', label: 'Team Follow-ups', icon: PhoneCall, gradient: 'from-sky-500 to-blue-600' },
];

const rankColors = ['#f59e0b', '#94a3b8', '#cd7f32', '#6366f1'];

export default function TeamPerformanceDashboard({ data }) {
  if (!data) return null;

  if (!data.members?.length) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-12 text-center text-content-muted">
        No sales executives yet. Add users with the Sales Executive role to see performance.
      </div>
    );
  }

  const chartData = data.members.map((m) => ({ name: m.name.split(' ')[0], revenue: m.revenue, conversions: m.conversions }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiCards.map(({ key, label, icon: Icon, gradient, format, hint }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.07]`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{label}</p>
                <p className="text-2xl font-bold text-content-primary mt-1 tabular-nums">
                  {format ? format(data[key]) : data[key]}
                </p>
                {hint && <p className="text-[10px] text-content-muted mt-1">{hint}</p>}
              </div>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
        >
          <h3 className="text-sm font-bold text-content-primary mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Team Ranking
          </h3>
          <div className="space-y-3">
            {data.members.map((member, i) => (
              <div key={member.name} className="flex items-center gap-4 p-3 rounded-xl bg-surface-elevated/50 border border-subtle">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-surface-elevated text-content-muted'}`}>
                  {i === 0 ? <Medal className="w-4 h-4" /> : member.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-content-primary">{member.name}</p>
                  <p className="text-xs text-content-muted">{member.conversions} conversions · {member.followUps} follow-ups</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-content-primary tabular-nums">{formatCurrency(member.revenue)}</p>
                  <p className="text-xs text-emerald-600 font-medium">{member.conversionRate}% CR</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
        >
          <h3 className="text-sm font-bold text-content-primary mb-4">Revenue by Executive</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-content-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [formatCurrency(v), 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={rankColors[i] || '#6366f1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
