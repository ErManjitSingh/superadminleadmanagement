import { motion } from 'framer-motion';
import { Eye, FileText, Trophy } from 'lucide-react';
import DashboardPanel from '../dashboard/DashboardPanel';
import { formatINR } from './reportUtils';

export default function PackagePerformance({ data }) {
  const maxRev = Math.max(...data.map((p) => p.revenue));

  return (
    <DashboardPanel title="Package Performance" subtitle="Views, quotations & conversion metrics">
      <div className="space-y-3">
        {data.map((pkg, i) => (
          <motion.div
            key={pkg.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl border border-subtle bg-surface-elevated/30 hover:border-amber-400/30 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-content-primary">{pkg.name}</p>
              <span className="text-sm font-black text-amber-700 metric-tabular shrink-0">{formatINR(pkg.revenue)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-content-muted"><Eye className="w-3.5 h-3.5 text-sky-500" /> {pkg.views} views</div>
              <div className="flex items-center gap-1.5 text-xs text-content-muted"><FileText className="w-3.5 h-3.5 text-violet-500" /> {pkg.quotationsSent} quotes</div>
              <div className="flex items-center gap-1.5 text-xs text-content-muted"><Trophy className="w-3.5 h-3.5 text-emerald-500" /> {pkg.conversions} sold</div>
            </div>
            <div className="h-1.5 rounded-full bg-surface overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(pkg.revenue / maxRev) * 100}%` }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardPanel>
  );
}
