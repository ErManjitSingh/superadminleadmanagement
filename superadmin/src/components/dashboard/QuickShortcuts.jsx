import { Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  LifeBuoy,
  Megaphone,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const SHORTCUTS = [
  { to: '/admin/companies/new', label: 'Create Company', icon: Building2 },
  { to: '/admin/plans', label: 'Create Plan', icon: Receipt },
  { to: '/admin/domains', label: 'Add Domain', icon: Globe },
  { to: '/admin/announcements', label: 'Send Announcement', icon: Megaphone },
  { to: '/admin/invoices', label: 'View Invoices', icon: Sparkles },
  { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy, badgeKey: 'tickets' },
];

export default function QuickShortcuts({ ticketCount = 0 }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card dark:border-slate-700/50 dark:bg-slate-900/80">
      <p className="mb-4 text-sm font-bold text-slate-800 dark:text-white">Quick Shortcuts</p>
      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey === 'tickets' && ticketCount > 0 ? ticketCount : null;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700',
                'transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
                'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-700 dark:hover:bg-violet-950/30'
              )}
            >
              <Icon className="h-4 w-4 text-violet-600" />
              {item.label}
              {badge != null && (
                <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
