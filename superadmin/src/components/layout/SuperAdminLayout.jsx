import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
} from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/plans', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/logs', label: 'System Logs', icon: FileText },
  { to: '/admin/settings', label: 'Global Settings', icon: Settings },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <div className="flex min-h-screen">
      <aside className="glass-sidebar fixed inset-y-0 left-0 z-30 flex w-64 flex-col text-slate-100">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">UNO Trips</p>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <NotificationBell />
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} className="text-slate-300 hover:text-white">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="flex-1 text-slate-300 hover:text-white">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6 lg:p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
