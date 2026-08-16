import { motion } from 'framer-motion';
import DashboardPanel from './DashboardPanel';

const STAGE_STYLES = [
  { from: '#2563EB', to: '#3B82F6', width: '100%' },
  { from: '#3B82F6', to: '#60A5FA', width: '86%' },
  { from: '#6366F1', to: '#818CF8', width: '68%' },
  { from: '#7C3AED', to: '#A78BFA', width: '48%' },
];

export default function ConversionOverview({ data = [], totalLeads = 0 }) {
  const stages = (data || []).slice(0, 4);
  const base = stages[0]?.count || totalLeads || 1;

  return (
    <DashboardPanel title="Conversion Overview" subtitle="Pipeline conversion funnel" className="h-full">
      {!stages.length ? (
        <p className="text-sm text-content-muted py-10 text-center">No funnel data yet</p>
      ) : (
        <div className="flex flex-col items-center gap-2.5 py-1 min-h-[220px] justify-center">
          {stages.map((stage, i) => {
            const style = STAGE_STYLES[i] || STAGE_STYLES[STAGE_STYLES.length - 1];
            const pct = base ? Math.round((stage.count / base) * 1000) / 10 : 0;
            return (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, scaleX: 0.85 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="relative w-full flex justify-center"
                style={{ maxWidth: style.width }}
              >
                <div
                  className="w-full h-12 sm:h-14 flex items-center justify-between px-4 sm:px-5 text-white shadow-sm"
                  style={{
                    background: `linear-gradient(90deg, ${style.from}, ${style.to})`,
                    clipPath:
                      i === stages.length - 1
                        ? 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)'
                        : 'polygon(0 0, 100% 0, 96% 100%, 4% 100%)',
                    borderRadius: i === 0 ? '10px 10px 4px 4px' : i === stages.length - 1 ? '4px 4px 10px 10px' : '4px',
                  }}
                >
                  <span className="text-[12px] sm:text-[13px] font-semibold truncate pr-2">{stage.stage}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-sm sm:text-base font-bold metric-tabular">{stage.count}</span>
                    <span className="text-[11px] font-medium text-white/85">{pct}%</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardPanel>
  );
}
