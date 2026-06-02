import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarTheme } from './SidebarThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import SidebarNavItem from './SidebarNavItem';
import { isNavItemActive } from './sidebar-utils';
import { cn } from '../../lib/utils';

export default function SidebarNavGroup({ group, defaultOpen = false }) {
  const { collapsed } = useSidebar();
  const { accent } = useSidebarTheme();
  const location = useLocation();
  const Icon = group.icon;

  const isChildActive = group.children.some((child) =>
    isNavItemActive(location.pathname, child.path)
  );

  const [open, setOpen] = useState(isChildActive || defaultOpen);
  const totalBadge = group.children.reduce((sum, c) => sum + (c.badge || 0), 0);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full flex items-center justify-center py-2.5 rounded-xl transition-colors relative',
                isChildActive
                  ? cn(accent.iconBoxActive, accent.iconActive)
                  : cn(accent.iconInactive, 'py-2.5 rounded-xl')
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {totalBadge > 0 && (
                <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{group.label}</TooltipContent>
        </Tooltip>
        {group.children.map((child) => (
          <SidebarNavItem
            key={child.path}
            item={child}
            isActive={isNavItemActive(location.pathname, child.path)}
            nested
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200',
          isChildActive || open
            ? cn(accent.groupActive)
            : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover/80'
        )}
      >
        <span
          className={cn(
            'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
            isChildActive || open
              ? cn(accent.iconBoxActive, accent.iconActive)
              : cn(accent.iconInactive)
          )}
        >
          <Icon className="w-[17px] h-[17px]" />
        </span>
        <span className="flex-1 text-left truncate">{group.label}</span>
        {totalBadge > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-500/12 text-red-600 dark:text-red-400 tabular-nums">
            {totalBadge}
          </span>
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 ml-5 pl-3 border-l-2 border-sidebar-border/80 space-y-0.5 py-0.5">
              {group.children.map((child) => (
                <SidebarNavItem
                  key={child.path}
                  item={child}
                  nested
                  isActive={isNavItemActive(location.pathname, child.path)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
