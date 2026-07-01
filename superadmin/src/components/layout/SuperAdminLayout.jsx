import { NavLink, Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Moon, Shield, Sun } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { APP_BRAND_NAME } from '../../lib/branding';
import { NAV_SECTIONS, PROFILE_NAV } from '../../lib/navConfig';

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
            <p className="text-sm font-semibold">{APP_BRAND_NAME}</p>
            <p className="text-xs text-slate-400">Platform Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-white/10 text-white shadow-inner'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white',
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            to={PROFILE_NAV.to}
            className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-200">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <NotificationBell />
          </Link>
          <div className="flex gap-2">
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

      <main className="ml-64 min-h-screen flex-1">
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
