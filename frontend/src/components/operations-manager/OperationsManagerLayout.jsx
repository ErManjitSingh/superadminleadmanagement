import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import AppSidebar from '../sidebar/AppSidebar';
import TopBar from '../TopBar';
import MissedFollowUpAlert from '../notifications/MissedFollowUpAlert';
import { operationsManagerNavItems } from './sidebar-config';

function OperationsManagerShell() {
  const { user } = useAuth();
  const { mobileOpen, setMobileOpen } = useSidebar();

  const sidebarProps = {
    user,
    navItems: operationsManagerNavItems,
    brandSubtitle: 'Operations ERP',
    accent: 'teal',
    profilePath: '/operations-manager/profile',
  };

  return (
    <div className="flex min-h-screen bg-surface-app">
      <div className="hidden lg:block h-screen sticky top-0">
        <AppSidebar {...sidebarProps} className="h-screen border-r-teal-500/10" />
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
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <MissedFollowUpAlert />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OperationsManagerLayout() {
  return (
    <SidebarProvider>
      <OperationsManagerShell />
    </SidebarProvider>
  );
}
