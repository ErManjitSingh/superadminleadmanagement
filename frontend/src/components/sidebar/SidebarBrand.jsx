import { motion, AnimatePresence } from 'framer-motion';
import { Plane, ChevronLeft, X } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { cn } from '../../lib/utils';
import { APP_BRAND_NAME, APP_DEFAULT_SUBTITLE } from '../../config/branding';

export default function SidebarBrand({ title = APP_BRAND_NAME, subtitle = APP_DEFAULT_SUBTITLE }) {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  if (collapsed) {
    return (
      <div className="px-2.5 pt-5 pb-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="group w-full flex flex-col items-center gap-2"
          aria-label="Expand sidebar"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Plane className="w-[17px] h-[17px] text-white" strokeWidth={2.25} />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pt-4 pb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
          <Plane className="w-[17px] h-[17px] text-white" strokeWidth={2.25} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="brand-text"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="flex-1 min-w-0"
          >
            <h1 className="text-[15px] font-bold tracking-tight leading-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{subtitle}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {mobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors hidden lg:flex"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
