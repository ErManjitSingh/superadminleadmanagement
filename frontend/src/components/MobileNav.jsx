import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, CalendarClock, User, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const baseTabs = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/leads', label: 'Leads', icon: Users },
  { path: '/followups', label: 'Follow', icon: CalendarClock },
  { path: '/profile', label: 'Profile', icon: User },
];

const adminAddTab = { path: '/leads/new', label: 'Add', icon: Plus, primary: true };

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const tabs = isAdmin
    ? [baseTabs[0], baseTabs[1], adminAddTab, baseTabs[2], baseTabs[3]]
    : [baseTabs[0], baseTabs[1], { path: '/reports', label: 'Reports', icon: FileText }, baseTabs[2], baseTabs[3]];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/leads/new') return location.pathname === '/leads/new';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass-panel border-t border-subtle safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);

          if (tab.primary) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center -mt-5"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/40 text-white">
                  <Icon className="w-6 h-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                active ? 'text-brand-600' : 'text-content-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
