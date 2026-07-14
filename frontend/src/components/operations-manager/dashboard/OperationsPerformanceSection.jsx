import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DEST_COLORS = ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'];

function ChartCard({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-subtle bg-white shadow-sm p-5 h-full"
    >
      <h3 className="font-bold text-content-primary mb-4">{title}</h3>
      {children}
    </motion.div>
  );
}

function WeeklyBarChart({ data, color, dataKey = 'thisWeek', compareKey = 'lastWeek' }) {
  const rows = data?.length
    ? data
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        day,
        thisWeek: 0,
        lastWeek: 0,
      }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={4} barCategoryGap="28%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={28}
            tick={{ fill: '#94A3B8', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.08)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
              fontSize: 12,
            }}
          />
          <Bar dataKey={compareKey} fill="#E2E8F0" radius={[6, 6, 0, 0]} maxBarSize={18} name="Last week" />
          <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={18} name="This week" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopDestinations({ destinations = [] }) {
  const list = destinations.length
    ? destinations
    : [{ name: 'No destinations yet', count: 0, percent: 0 }];

  return (
    <div className="space-y-3.5">
      {list.map((d, i) => (
        <div key={`${d.name}-${i}`}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-sm font-semibold text-content-primary truncate">{d.name}</p>
            <p className="text-xs font-bold text-content-secondary tabular-nums shrink-0">{d.percent}%</p>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(d.percent || 0, d.count ? 4 : 0)}%`,
                backgroundColor: DEST_COLORS[i % DEST_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OperationsPerformanceSection({ weeklyPerformance, topDestinations }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2">
        <ChartCard title="Operations Performance" delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-content-muted mb-2">Bookings vs Last Week</p>
              <WeeklyBarChart data={weeklyPerformance?.bookings} color="#7C3AED" />
            </div>
            <div>
              <p className="text-xs font-semibold text-content-muted mb-2">Revenue vs Last Week</p>
              <WeeklyBarChart data={weeklyPerformance?.revenue} color="#22C55E" />
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Top Destinations" delay={0.1}>
        <TopDestinations destinations={topDestinations} />
      </ChartCard>
    </div>
  );
}
