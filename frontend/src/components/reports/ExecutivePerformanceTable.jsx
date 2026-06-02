import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Avatar from '../ui/Avatar';
import DashboardPanel from '../dashboard/DashboardPanel';
import { formatINR } from './reportUtils';

export default function ExecutivePerformanceTable({ data }) {
  return (
    <DashboardPanel title="Executive Performance" subtitle="Ranked by revenue generated" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-subtle">
              {['Rank', 'Executive', 'Assigned', 'Follow-ups', 'Conversions', 'Revenue', 'Conv. %'].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-[11px] uppercase font-semibold text-content-muted whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {data.map((ex, i) => (
              <motion.tr key={ex.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="hover:bg-indigo-500/[0.03]">
                <td className="px-3 py-3">
                  {ex.rank <= 3 ? (
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black ${ex.rank === 1 ? 'bg-amber-500/20 text-amber-700' : ex.rank === 2 ? 'bg-slate-400/20 text-slate-600' : 'bg-orange-500/20 text-orange-700'}`}>
                      {ex.rank === 1 ? <Trophy className="w-3.5 h-3.5" /> : ex.rank}
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-content-muted pl-2">{ex.rank}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={ex.name} size="sm" className="!w-8 !h-8 !text-xs" />
                    <span className="text-sm font-semibold text-content-primary whitespace-nowrap">{ex.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-sm metric-tabular">{ex.assignedLeads}</td>
                <td className="px-3 py-3 text-sm metric-tabular">{ex.followUpsDone}</td>
                <td className="px-3 py-3 text-sm metric-tabular font-semibold text-emerald-600">{ex.conversions}</td>
                <td className="px-3 py-3 text-sm metric-tabular font-bold">{formatINR(ex.revenue)}</td>
                <td className="px-3 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700 text-xs font-bold">{ex.conversionRate}%</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
