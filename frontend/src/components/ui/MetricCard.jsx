import { TrendingDown, TrendingUp } from 'lucide-react';

const accentColors = {
  blue: 'from-blue-500/20 to-transparent border-blue-500/30',
  emerald: 'from-emerald-500/20 to-transparent border-emerald-500/30',
  amber: 'from-amber-500/20 to-transparent border-amber-500/30',
  violet: 'from-violet-500/20 to-transparent border-violet-500/30',
  gold: 'from-yellow-500/20 to-transparent border-yellow-500/30',
};

export default function MetricCard({ label, value, change, changeType = 'up', icon: Icon, accent = 'blue', onClick }) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`card-premium p-5 relative overflow-hidden text-left w-full ${onClick ? 'cursor-pointer hover:border-brand-500/30' : ''}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentColors[accent]}`} />
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-content-muted mb-2">{label}</p>
          <p className="text-3xl font-bold text-content-primary metric-tabular truncate">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {changeType === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${changeType === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {change}
              </span>
              <span className="text-xs text-content-muted">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-brand-500" />
          </div>
        )}
      </div>
    </Wrapper>
  );
}
