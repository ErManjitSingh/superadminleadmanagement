import { Link } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarTheme } from './SidebarThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { prefetchRoute } from '../../lib/routePrefetch';

export default function SidebarNavItem({ item, isActive, nested = false }) {
  const { collapsed, setMobileOpen } = useSidebar();
  const { accent } = useSidebarTheme();
  const Icon = item.icon;

  const linkContent = (
    <Link
      to={item.path}
      onMouseEnter={() => prefetchRoute(item.path)}
      onFocus={() => prefetchRoute(item.path)}
      onClick={() => setMobileOpen(false)}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200',
        nested ? 'px-3 py-2 ml-1' : 'px-3 py-2.5',
        collapsed ? 'justify-center px-0 py-2.5' : '',
        isActive
          ? cn(accent.itemActive)
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
      )}
    >
      <Icon
        className={cn(
          'shrink-0',
          nested ? 'w-4 h-4' : 'w-[18px] h-[18px]',
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
        )}
        strokeWidth={isActive ? 2.25 : 2}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  'text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md',
                  isActive ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-slate-400'
                )}
              >
                {item.count > 999 ? '999+' : item.count}
              </span>
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md',
                  isActive ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-300'
                )}
              >
                {item.badge > 999 ? '999+' : item.badge}
              </span>
            )}
          </div>
        </>
      )}

      {collapsed && (item.badge || item.count) && (
        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-[#0f172a]" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2 font-medium">
          {item.label}
          {(item.badge || item.count) ? ` (${item.badge || item.count})` : ''}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
