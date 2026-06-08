import { cn } from '../../lib/utils';

const STYLES = {
  hot: 'bg-rose-500/15 text-rose-700 ring-rose-400/30',
  warm: 'bg-amber-500/15 text-amber-700 ring-amber-400/30',
  cold: 'bg-slate-500/15 text-slate-600 ring-slate-400/30',
  vip: 'bg-violet-500/15 text-violet-700 ring-violet-400/30',
};

const EMOJI = { hot: '🔥', warm: '🟡', cold: '⚪', vip: '💎' };

export default function LeadTemperatureBadge({ temperature, className }) {
  if (!temperature) return null;
  const key = temperature.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase ring-1 ring-inset whitespace-nowrap',
        STYLES[key] || STYLES.cold,
        className
      )}
    >
      <span>{EMOJI[key]}</span>
      {key}
    </span>
  );
}
