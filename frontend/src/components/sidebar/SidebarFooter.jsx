import { Link } from 'react-router-dom';
import { Crown, ArrowRight, HelpCircle, LifeBuoy } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import SidebarUserCard from './SidebarUserCard';
import { cn } from '../../lib/utils';

export default function SidebarFooter({
  user,
  links,
  showUpgrade = true,
  upgradeHref = '/sales-executive/profile',
  helpHref = 'mailto:support@indiaholidaydestination.com',
  tip,
}) {
  const { collapsed, setMobileOpen } = useSidebar();
  const shortcutLinks = Array.isArray(links) ? links : [];

  return (
    <div className="mt-auto shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/35 via-black/10 to-transparent">
      {!collapsed && showUpgrade && (
        <div className="px-3 pt-3">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-violet-400/20 p-3.5',
              'bg-gradient-to-br from-[#2a1f55] via-[#1e1638] to-[#12101f]',
              'shadow-lg shadow-violet-950/40'
            )}
          >
            <div className="absolute -top-6 -right-4 w-20 h-20 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-2.5 mb-3 relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                <Crown className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">Upgrade to Pro</p>
                <p className="text-[10px] text-slate-400 leading-snug mt-1">
                  Unlock advanced analytics, automation &amp; more.
                </p>
              </div>
            </div>
            <Link
              to={upgradeHref}
              onClick={() => setMobileOpen(false)}
              className="relative flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 shadow-md shadow-violet-600/30 transition-all"
            >
              Upgrade Now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {!collapsed && shortcutLinks.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Shortcuts
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {shortcutLinks.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-center',
                    'border border-white/[0.06] bg-white/[0.04]',
                    'hover:bg-white/[0.09] hover:border-white/[0.12] transition-colors group'
                  )}
                >
                  <Icon className="w-4 h-4 text-violet-300 group-hover:text-violet-200" strokeWidth={2} />
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 leading-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {!collapsed && tip && (
        <div className="px-3 pt-2">
          <a
            href={helpHref}
            className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-violet-500/10 px-3 py-2.5 hover:bg-violet-500/15 transition-colors"
          >
            <LifeBuoy className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-200">Support</p>
              <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{tip}</p>
            </div>
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          </a>
        </div>
      )}

      <SidebarUserCard user={user} />
    </div>
  );
}
