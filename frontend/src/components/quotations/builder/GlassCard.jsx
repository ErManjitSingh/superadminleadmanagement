import { cn } from '../../../lib/utils';

export default function GlassCard({ children, className, glow }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/20 dark:border-white/10',
        'bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg shadow-black/5',
        glow && 'ring-1 ring-sky-500/20',
        className
      )}
    >
      {children}
    </div>
  );
}
