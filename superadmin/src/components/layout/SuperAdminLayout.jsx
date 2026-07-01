import { NavLink, Outlet, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LifeBuoy, Plane, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { APP_BRAND_NAME } from '../../lib/branding';
import { NAV_SECTIONS, SETTINGS_NAV } from '../../lib/navConfig';
import { superAdminApi } from '../../api/superadmin';
import PlatformTopBar from './PlatformTopBar';

export default function SuperAdminLayout() {
  const { user } = useAuth();

  const { data: dash } = useQuery({
    queryKey: ['dashboard-nav'],
    queryFn: () => superAdminApi.getDashboard().then((r) => r.data),
    staleTime: 60000,
  });

  const ticketCount = dash?.metrics?.pendingSupportTickets || 0;

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] dark:bg-[#0b0f17]">
      <aside className="platform-sidebar fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col text-slate-200">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{APP_BRAND_NAME}</p>
            <p className="text-[11px] text-slate-400">Platform Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={`${item.to}-${item.label}`}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/30'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badgeKey === 'tickets' && ticketCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">
                        {ticketCount > 99 ? '99+' : ticketCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20">
              <LifeBuoy className="h-4 w-4 text-violet-300" />
            </div>
            <p className="text-sm font-semibold text-white">Need Help?</p>
            <p className="mt-1 text-xs text-slate-400">Contact our support team for platform assistance.</p>
            <Link to="/admin/support">
              <Button size="sm" className="mt-3 w-full rounded-xl bg-violet-600 hover:bg-violet-500">
                Contact Support
              </Button>
            </Link>
          </div>

          <NavLink
            to={SETTINGS_NAV.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Settings className="h-4 w-4" />
            {SETTINGS_NAV.label}
          </NavLink>

          <p className="px-3 text-[10px] text-slate-500 truncate">{user?.email}</p>
        </div>
      </aside>

      <div className="ml-[260px] flex min-h-screen flex-1 flex-col">
        <PlatformTopBar />
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-6 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
