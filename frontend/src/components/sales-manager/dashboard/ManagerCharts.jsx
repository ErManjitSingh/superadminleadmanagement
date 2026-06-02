import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import { formatCurrency } from '../managerUtils';

export default function ManagerCharts({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Lead Sources" delay={0.1}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.leadSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.leadSources.map((e) => <Cell key={e.name} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-border-subtle)', background: 'var(--color-surface)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {data.leadSources.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-content-muted">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.name}
            </span>
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Team Revenue" delay={0.15}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.teamRevenueChart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 100000}L`} />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 12 }} />
            <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Executive Performance" delay={0.2}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.executivePerformance} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={56} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 12 }} />
            <Bar dataKey="revenue" fill="#059669" radius={[0, 6, 6, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Conversion Rate" delay={0.25}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.monthlyConversion} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Conversion']} contentStyle={{ borderRadius: 12 }} />
            <Line type="monotone" dataKey="rate" stroke="#7C3AED" strokeWidth={2.5} dot={{ r: 4, fill: '#7C3AED' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
    >
      <h3 className="text-sm font-bold text-content-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}
