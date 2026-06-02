import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Medal } from 'lucide-react';
import { formatCurrency } from '../leaderUtils';

export default function LeaderCharts({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartPanel title="Team Revenue Trend" delay={0.2}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.teamRevenueTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12 }} />
            <Bar dataKey="revenue" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Executive Ranking" delay={0.25}>
        <div className="space-y-3">
          {data.executiveRanking?.map((ex, i) => (
            <div key={ex._id} className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-500/20 text-amber-600' : 'bg-surface-elevated text-content-muted'}`}>
                {i === 0 ? <Medal className="w-4 h-4" /> : ex.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-content-primary">{ex.name}</span>
                  <span className="font-bold tabular-nums text-amber-600">{formatCurrency(ex.revenue)}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(ex.revenue / (data.executiveRanking[0]?.revenue || 1)) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  />
                </div>
                <p className="text-[10px] text-content-muted mt-1">{ex.conversions} conversions · {ex.conversionRate}% CR</p>
              </div>
            </div>
          ))}
        </div>
      </ChartPanel>

      <ChartPanel title="Conversion Funnel" delay={0.3}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.conversionFunnel} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="stage" width={72} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
              {data.conversionFunnel?.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Lead Sources" delay={0.35}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data.leadSources}
              dataKey="count"
              nameKey="source"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.leadSources?.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12 }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Reactivated Lead Live Progress" delay={0.4}>
        <div className="space-y-2">
          {data.reactivationWidget?.liveProgress?.length ? data.reactivationWidget.liveProgress.map((lead) => (
            <div key={lead._id} className="p-3 rounded-xl border border-subtle bg-surface-elevated/40">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-content-primary truncate">{lead.name}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300">
                  {lead.stage?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-content-muted mt-1">{lead.executive}</p>
            </div>
          )) : <p className="text-sm text-content-muted">No reactivated leads in your squad.</p>}
        </div>
      </ChartPanel>
    </div>
  );
}

function ChartPanel({ title, children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
    >
      <h3 className="font-bold text-content-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
