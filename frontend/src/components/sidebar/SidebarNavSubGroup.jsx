import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import SidebarNavItem from './SidebarNavItem';
import { isNavItemActive } from './sidebar-utils';
import { cn } from '../../lib/utils';

export default function SidebarNavSubGroup({ section, defaultOpen = false, forceOpen = false }) {
  const { collapsed } = useSidebar();
  const location = useLocation();

  const isChildActive = section.items.some((child) =>
    isNavItemActive(location.pathname, child.path)
  );

  const [open, setOpen] = useState(section.defaultOpen ?? defaultOpen ?? isChildActive);

  useEffect(() => {
    if (forceOpen || isChildActive) setOpen(true);
  }, [forceOpen, isChildActive]);

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {section.items.map((child) => (
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
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
          'text-[10px] font-bold uppercase tracking-[0.12em]',
          isChildActive ? 'text-slate-300' : 'text-slate-500 hover:text-slate-400'
        )}
      >
        <span className="flex-1 text-left">{section.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-1">
              {section.items.map((child) => (
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
