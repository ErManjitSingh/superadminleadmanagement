import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';

const BAR_COLORS = ['#22C55E', '#16A34A', '#4ADE80', '#86EFAC', '#BBF7D0', '#A7F3D0', '#6EE7B7', '#34D399'];

/** Decorative India silhouette — visual anchor matching mock layout */
function IndiaMapArt() {
  return (
    <svg viewBox="0 0 220 260" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="indiaFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#BBF7D0" />
          <stop offset="55%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
      </defs>
      <path
        fill="url(#indiaFill)"
        stroke="#16A34A"
        strokeWidth="1.2"
        opacity="0.95"
        d="M112 18c8 2 18 8 24 16 6 7 10 16 9 24 4 2 10 3 14 8 5 6 6 14 4 21 5 3 11 9 12 16 1 8-3 15-8 20 3 6 4 14 1 20-2 5-7 9-12 11 1 7-1 15-6 20-4 5-10 8-16 9v18c0 6-2 12-6 16-5 5-12 6-18 4-4 7-11 12-19 13-7 1-14-2-18-8-6 2-13 1-18-3-6-5-8-13-6-20-7-2-13-7-16-14-3-7-2-15 2-21-5-5-7-13-5-20 2-7 8-12 14-14-1-7 1-15 6-20 4-5 11-8 17-8 1-7 5-14 11-18 7-5 16-6 24-4 3-5 8-9 14-11z"
      />
      <circle cx="98" cy="72" r="3.2" fill="#15803D" opacity="0.55" />
      <circle cx="128" cy="108" r="2.8" fill="#15803D" opacity="0.45" />
      <circle cx="86" cy="140" r="3" fill="#15803D" opacity="0.5" />
      <circle cx="110" cy="168" r="2.6" fill="#15803D" opacity="0.4" />
    </svg>
  );
}

export default function LeadsByLocationPanel({ data = [] }) {
  const rows = (data || []).slice(0, 7);
  const max = rows[0]?.count || 1;

  return (
    <DashboardPanel title="Leads By Location" subtitle="Top destinations" className="h-full">
      {!rows.length ? (
        <p className="text-sm text-content-muted py-10 text-center">No destination data yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-center min-h-[220px]">
          <div className="h-[200px] sm:h-[220px] rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center p-3">
            <IndiaMapArt />
          </div>
          <div className="space-y-2.5">
            {rows.map((row, i) => (
              <motion.div
                key={`${row.name}-${i}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[72px_1fr_44px] items-center gap-2"
              >
                <span className="text-[12px] font-medium text-content-secondary truncate" title={row.name}>
                  {row.name}
                </span>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(8, (row.count / max) * 100)}%` }}
                    transition={{ duration: 0.55, delay: 0.08 + i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                </div>
                <span className="text-[12px] font-bold text-content-primary metric-tabular text-right">
                  {row.pct ?? 0}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
