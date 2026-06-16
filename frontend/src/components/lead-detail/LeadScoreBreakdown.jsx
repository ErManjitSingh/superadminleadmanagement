import { computeLeadScores, DETAIL_CARD } from './leadDetailUtils';

function ScoreRing({ label, value, color, max = 100, suffix = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[88px] h-[88px]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" />
          <circle
            cx="44"
            cy="44"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{value}{suffix}</span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-slate-500 mt-2 leading-tight">{label}</p>
    </div>
  );
}

export default function LeadScoreBreakdown({ lead }) {
  const scores = computeLeadScores(lead);

  return (
    <div className={DETAIL_CARD}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Score Breakdown</h3>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ScoreRing label="Budget Score" value={scores.budgetScore} color="#22C55E" />
        <ScoreRing label="Engagement Score" value={scores.engagementScore} color="#3B82F6" />
        <ScoreRing label="Response Score" value={scores.responseScore} color="#8B5CF6" />
        <ScoreRing label="Conversion Probability" value={scores.conversionProbability} color="#F97316" suffix="%" />
      </div>
    </div>
  );
}
