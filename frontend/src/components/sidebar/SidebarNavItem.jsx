import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarTheme } from './SidebarThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
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
        'group relative flex items-center gap-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
        nested ? 'px-2.5 py-2 ml-1' : 'px-2.5 py-2',
        collapsed ? 'justify-center px-0 py-2.5' : '',
        isActive
          ? cn(accent.itemActive)
          : 'text-sidebar-muted hover:text-sidebar-text hover:bg-white/55 dark:hover:bg-slate-900/45'
      )}
    >
      {isActive && !collapsed && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full', accent.indicator)}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}

      <span
        className={cn(
          'relative shrink-0 flex items-center justify-center rounded-lg transition-all duration-200',
          nested ? 'w-7 h-7' : 'w-8 h-8',
          isActive
            ? cn(accent.iconBoxActive, accent.iconActive)
            : cn(accent.iconInactive)
        )}
      >
        <Icon className={cn(nested ? 'w-3.5 h-3.5' : 'w-[17px] h-[17px]')} strokeWidth={isActive ? 2.25 : 2} />
        {collapsed && (item.badge || item.count) && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-sidebar-bg" />
        )}
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.count !== undefined && item.count > 0 && (
              <span className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-sidebar-hover text-sidebar-muted">
                {item.count > 99 ? '99+' : item.count}
              </span>
            )}
            {item.badge !== undefined && item.badge > 0 && (
              <Badge variant={item.badge > 5 ? 'destructive' : 'warning'} size="sm">
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </div>
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2 font-medium">
          {item.label}
          {item.badge !== undefined && (
            <Badge variant="destructive" size="sm">
              {item.badge}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}
