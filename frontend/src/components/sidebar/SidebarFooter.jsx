import { Link } from 'react-router-dom';
import { CalendarClock, Flame, Bell, HelpCircle, LifeBuoy } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import SidebarUserCard from './SidebarUserCard';
import { cn } from '../../lib/utils';

export default function SidebarFooter({
  user,
  links,
  helpHref = 'mailto:support@indiaholidaydestination.com',
  tip = 'Need help? Contact support anytime.',
}) {
  const { collapsed, setMobileOpen } = useSidebar();
  const shortcutLinks = Array.isArray(links) ? links : [];

  return (
    <div className="mt-auto shrink-0 border-t border-white/[0.08] bg-gradient-to-t from-black/30 to-transparent">
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
