import { motion, AnimatePresence } from 'framer-motion';
import { Plane, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarTheme } from './SidebarThemeContext';
import { cn } from '../../lib/utils';
import { APP_BRAND_NAME, APP_DEFAULT_SUBTITLE } from '../../config/branding';

export default function SidebarBrand({ title = APP_BRAND_NAME, subtitle = APP_DEFAULT_SUBTITLE }) {
  const { collapsed, toggleCollapsed } = useSidebar();
  const { accent } = useSidebarTheme();

  const titleParts = title.split(' ');
  const firstWord = titleParts[0] || title;
  const restWords = titleParts.slice(1).join(' ');

  if (collapsed) {
    return (
      <div className="px-2.5 pt-4 pb-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="group w-full flex flex-col items-center gap-2"
          aria-label="Expand sidebar"
        >
          <div className="relative">
            <div
              className={cn(
                'absolute -inset-1 rounded-[14px] opacity-40 blur-md bg-gradient-to-br',
                accent.brandGradient
              )}
            />
            <div
              className={cn(
                'relative w-10 h-10 rounded-[13px] flex items-center justify-center bg-gradient-to-br shadow-md',
                accent.brandGradient
              )}
            >
              <Plane className="w-[17px] h-[17px] text-white" strokeWidth={2.25} />
            </div>
          </div>
          <PanelLeft className="w-3.5 h-3.5 text-sidebar-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 pb-3">
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-3',
          'border-sidebar-border/80',
          'bg-white/55 backdrop-blur-md',
          'dark:bg-slate-900/55 dark:backdrop-blur-md',
          'shadow-[0_2px_16px_-4px_rgba(15,23,42,0.12)]',
          'dark:shadow-[0_2px_16px_-4px_rgba(0,0,0,0.45)]'
        )}
      >
        {/* Soft accent wash */}
        <div
          className={cn(
            'absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-50 pointer-events-none bg-gradient-to-br',
            accent.brandGradient
          )}
        />
        <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-gradient-to-b', accent.brandGradient)} />

        <div className="relative flex items-center gap-3">
          {/* Logo */}
          <div className="relative shrink-0">
            <div
              className={cn(
                'w-10 h-10 rounded-[13px] flex items-center justify-center bg-gradient-to-br shadow-md',
                accent.brandGradient,
                accent.brandShadow
              )}
            >
              <Plane className="w-[17px] h-[17px] text-white" strokeWidth={2.25} />
            </div>
          </div>

          {/* Text */}
          <AnimatePresence mode="wait">
            <motion.div
              key="brand-text"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="flex-1 min-w-0"
            >
              <h1 className="text-[15px] font-bold tracking-tight leading-tight">
                <span
                  className={cn(
                    firstWord.toUpperCase() === 'UNO'
                      ? accent.titleOrange
                      : cn('bg-clip-text text-transparent bg-gradient-to-r', accent.titleGradient)
                  )}
                >
                  {firstWord}
                </span>
                {restWords && (
                  <span className="text-sidebar-text"> {restWords}</span>
                )}
              </h1>
              <p className="flex items-center gap-1.5 mt-1 min-w-0">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 bg-gradient-to-r', accent.brandGradient)} />
                <span className="text-[11px] font-medium text-sidebar-muted truncate">{subtitle}</span>
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Collapse */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'shrink-0 p-1.5 rounded-lg transition-colors hidden lg:flex',
              'text-sidebar-muted hover:text-sidebar-text',
              'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            )}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
