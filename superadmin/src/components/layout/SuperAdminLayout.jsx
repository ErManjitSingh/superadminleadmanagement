import { NavLink, Outlet, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronDown, Plane, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { APP_BRAND_NAME } from '../../lib/branding';
import { NAV_SECTIONS, SETTINGS_NAV } from '../../lib/navConfig';
import { superAdminApi } from '../../api/superadmin';
import PlatformTopBar from './PlatformTopBar';
import SystemStatusWidget from './SystemStatusWidget';

export default function SuperAdminLayout() {
  const { user } = useAuth();

  const { data: dash } = useQuery({
    queryKey: ['dashboard-nav'],
    queryFn: () => superAdminApi.getDashboard().then((r) => r.data),
    staleTime: 60000,
  });

  const { data: pendingPayments } = useQuery({
    queryKey: ['payment-requests', 'submitted'],
    queryFn: () => superAdminApi.listPaymentRequests({ status: 'submitted' }).then((r) => r.data),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const ticketCount = dash?.metrics?.pendingSupportTickets || 0;
  const paymentCount = pendingPayments?.pagination?.total ?? pendingPayments?.data?.length ?? 0;
  const badgeCounts = { tickets: ticketCount, payments: paymentCount };

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] dark:bg-[#0b0f17]">
      <aside className="platform-sidebar fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col text-slate-200">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/40">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{APP_BRAND_NAME}</p>
            <p className="text-[11px] text-slate-400">Super Admin</p>
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
                    {item.badgeKey && badgeCounts[item.badgeKey] > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">
                        {badgeCounts[item.badgeKey] > 99 ? '99+' : badgeCounts[item.badgeKey]}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <SystemStatusWidget />

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

          <Link
            to="/admin/profile"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
              {user?.name?.[0] || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name || 'Super Admin'}</p>
              <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          </Link>
        </div>
      </aside>

      <div className="ml-[260px] flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        <PlatformTopBar />
        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-w-0 flex-1 p-4 lg:p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
