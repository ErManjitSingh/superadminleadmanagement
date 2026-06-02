import { Search, Command, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarTheme } from './SidebarThemeContext';
import { cn } from '../../lib/utils';

export default function SidebarSearch({ value = '', onChange }) {
  const { collapsed } = useSidebar();
  const { accent } = useSidebarTheme();

  if (collapsed) {
    return (
      <div className="px-2.5 py-2.5">
        <button
          type="button"
          className="w-full h-9 flex items-center justify-center rounded-xl bg-orange-500/10 backdrop-blur-sm text-orange-500 hover:text-orange-600 hover:bg-orange-500/18 transition-colors border border-orange-500/20 dark:bg-orange-500/15"
          aria-label="Search menu"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-3 py-2.5"
      >
        <div className="relative group">
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-400 transition-colors',
              accent.searchIconFocus
            )}
          />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Search menu..."
            className={cn(
              'w-full h-9 pl-9 pr-10 rounded-xl bg-white/50 backdrop-blur-sm border border-sidebar-border/80',
              'dark:bg-slate-900/40',
              'text-[13px] text-sidebar-text placeholder:text-sidebar-muted/80',
              'outline-none transition-all',
              accent.searchFocus
            )}
          />
          {value ? (
            <button
              type="button"
              onClick={() => onChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/70 backdrop-blur-sm border border-sidebar-border/80 text-[9px] font-semibold text-sidebar-muted pointer-events-none">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
