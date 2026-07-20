import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useSidebarTheme } from './SidebarThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

function getInitials(name) {
  return (
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  );
}

function formatRole(user) {
  if (user?.roleName) return user.roleName;
  const role = String(user?.role || 'Agent').replace(/_/g, ' ');
  return role.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SidebarUserCard({ user }) {
  const { collapsed, setMobileOpen } = useSidebar();
  const { accent, profilePath } = useSidebarTheme();
  const initials = getInitials(user?.name);
  const roleLabel = formatRole(user);

  const profileCard = (
    <Link
      to={profilePath}
      onClick={() => setMobileOpen(false)}
      className={cn(
        'flex items-center gap-3 min-w-0 rounded-2xl p-2 transition-colors hover:bg-white/[0.08]',
        collapsed && 'justify-center'
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white shadow-md',
            accent.avatarGradient
          )}
        >
          {initials}
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{roleLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <div className="p-3">
        <Tooltip>
          <TooltipTrigger asChild>{profileCard}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-content-muted">{roleLabel}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-3 pt-2 border-t border-white/[0.06]"
      >
        {profileCard}
      </motion.div>
    </AnimatePresence>
  );
}
