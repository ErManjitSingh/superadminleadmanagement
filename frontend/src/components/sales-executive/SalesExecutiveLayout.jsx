import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Flame, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import AppSidebar from '../sidebar/AppSidebar';
import TopBar from '../TopBar';
import MissedFollowUpAlert from '../notifications/MissedFollowUpAlert';
import SalesExecutiveMobileNav from './SalesExecutiveMobileNav';
import { salesExecutiveNavItems } from './sidebar-config';

const SE_FOOTER_LINKS = [
  { path: '/sales-executive/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { path: '/sales-executive/leads/hot', label: 'Hot Leads', icon: Flame },
  { path: '/sales-executive/notifications', label: 'Alerts', icon: Bell },
];

function SalesExecutiveShell() {
  const { user } = useAuth();
  const { mobileOpen, setMobileOpen } = useSidebar();

  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = '';
  }, []);

  const sidebarProps = {
    user,
    navItems: salesExecutiveNavItems,
    brandSubtitle: 'Sales Executive',
    accent: 'violet',
    profilePath: '/sales-executive/profile',
    quickActions: [],
    showFooter: true,
    showUpgrade: true,
    footerLinks: SE_FOOTER_LINKS,
    footerTip: undefined,
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-surface-app">
      <div className="hidden lg:block h-screen sticky top-0 z-40">
        <AppSidebar {...sidebarProps} className="h-screen border-r-violet-500/10" />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50"
            >
              <AppSidebar {...sidebarProps} className="h-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main data-workspace-main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-6 max-w-[1680px] mx-auto">
            <MissedFollowUpAlert />
            <Outlet />
          </div>
        </main>
        <SalesExecutiveMobileNav />
      </div>
    </div>
  );
}

export default function SalesExecutiveLayout() {
  return (
    <SidebarProvider>
      <SalesExecutiveShell />
    </SidebarProvider>
  );
}
