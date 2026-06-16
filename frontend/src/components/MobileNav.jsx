import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, CalendarClock, User, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MobileBottomNav from './ui/MobileBottomNav';

const baseTabs = [
  { path: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
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
    if (path === '/admin/dashboard') {
      return location.pathname === '/' || location.pathname === '/admin/dashboard';
    }
    if (path === '/leads/new') return location.pathname === '/leads/new';
    return location.pathname.startsWith(path);
  };

  return <MobileBottomNav tabs={tabs} isActive={isActive} accent="brand" />;
}
