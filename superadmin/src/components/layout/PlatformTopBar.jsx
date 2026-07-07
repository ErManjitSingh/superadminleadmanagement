import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, Moon, Search, Sun } from 'lucide-react';
import NotificationBell from '../NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';

function todayLabel() {
  const d = new Date();
  return `Today, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function PlatformTopBar({ showDateExport = false, onExport }) {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-16 items-center gap-4 px-6">
        <div className="relative hidden flex-1 max-w-xl md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search companies, domains, invoices..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-16 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-slate-600 dark:bg-slate-800">
            ⌘K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={toggle} className="rounded-xl text-slate-500">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationBell variant="header" />

          <Link
            to="/admin/profile"
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 py-1.5 pl-1.5 pr-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
              {user?.name?.[0] || 'S'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-tight">{user?.name || 'Super Admin'}</p>
              <p className="max-w-[140px] truncate text-[10px] text-slate-500">{user?.email}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
          </Link>
        </div>
      </div>

      {showDateExport && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-2 dark:border-slate-800">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900"
          >
            <Calendar className="h-3.5 w-3.5" />
            {todayLabel()}
          </button>
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onExport}>
            Export Report
          </Button>
        </div>
      )}
    </header>
  );
}
