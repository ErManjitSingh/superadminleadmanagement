import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import SidebarNavItem from './SidebarNavItem';
import { isNavItemActive } from './sidebar-utils';
import { cn } from '../../lib/utils';

import { useSidebarTheme } from './SidebarThemeContext';

export default function SidebarNavGroup({ group, defaultOpen = false }) {
  const { collapsed } = useSidebar();
  const { accent } = useSidebarTheme();
  const location = useLocation();
  const Icon = group.icon;

  const isChildActive = group.children.some((child) =>
    isNavItemActive(location.pathname, child.path)
  );

  const [open, setOpen] = useState(isChildActive || defaultOpen);
  const childBadgeSum = group.children.reduce((sum, c) => sum + (c.badge || 0) + (c.count || 0), 0);
  const groupCount = group.count;
  const groupBadge = group.badge;
  const displayCount = groupCount !== undefined ? groupCount : undefined;
  const displayBadge = groupBadge !== undefined ? groupBadge : (displayCount === undefined && childBadgeSum > 0 ? childBadgeSum : undefined);

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
                  ? cn(accent.itemActive)
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
              )}
            >
              <Icon className="w-[18px] h-[18px]" />
              {(displayCount > 0 || (displayBadge !== undefined && displayBadge > 0)) && (
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-400 ring-2 ring-[#0f172a]" />
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
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
          isChildActive
            ? 'text-white'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
        )}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left truncate">{group.label}</span>
        {displayCount !== undefined && displayCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-white/[0.08] text-slate-400 tabular-nums">
            {displayCount > 999 ? '999+' : displayCount}
          </span>
        )}
        {displayBadge !== undefined && displayBadge > 0 && displayCount === undefined && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/20 text-blue-300 tabular-nums">
            {displayBadge > 999 ? '999+' : displayBadge}
          </span>
        )}
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
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
            <div className="mt-0.5 ml-4 pl-3 border-l border-white/[0.08] space-y-0.5 py-0.5">
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
