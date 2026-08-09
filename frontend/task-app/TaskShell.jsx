import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  ClipboardCheck,
  Columns3,
  FolderKanban,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';
import { useTenant, useTenantBranding } from '../src/context/TenantContext';
import { useNotifications } from '../src/context/NotificationContext';
import TeamAccessPage from './TeamAccessPage';
import WorkOverviewPage from './WorkOverviewPage';
import WorkspacesPage from './WorkspacesPage';
import ProjectsPage from './ProjectsPage';
import TasksPage from './TasksPage';
import TaskBoardPage from './TaskBoardPage';
import ApprovalCenterPage from './ApprovalCenterPage';
import { fetchMyWorkAccess } from './api/workApi';

const navigation = [
  { label: 'Overview', icon: LayoutDashboard, path: '/', ready: true },
  { label: 'My Work', icon: CheckSquare2, path: '/my-work', ready: true },
  { label: 'Workspaces', icon: LayoutGrid, path: '/workspaces', ready: true },
  { label: 'Projects', icon: FolderKanban, path: '/projects', ready: true },
  { label: 'Board', icon: Columns3, path: '/board', ready: true },
  { label: 'Approvals', icon: ClipboardCheck, path: '/approvals', ready: true },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Team', icon: Users, path: '/team', ready: true },
  { label: 'Settings', icon: Settings },
];

function Sidebar({ mobile = false, onClose, navItems = navigation }) {
  const { user, logout } = useAuth();
  const { appTitle, logo } = useTenantBranding();

  return (
    <aside className={`${mobile ? 'w-[286px]' : 'w-[250px]'} flex h-full flex-col border-r border-emerald-950/10 bg-[#0d3b2a] text-white`}>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        {logo ? (
          <img src={logo} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-1" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white font-black text-emerald-900">W</div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">WorkFlow Hub</p>
          <p className="truncate text-[10px] text-emerald-100/60">{appTitle || 'Company workspace'}</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map(({ label, icon: Icon, path, ready }) => {
          const content = (
            <>
              <Icon className="h-[18px] w-[18px]" />
              <span>{label}</span>
              {!ready && <span className="ml-auto text-[9px] uppercase tracking-wide text-emerald-100/35">Soon</span>}
            </>
          );
          return ready ? (
            <Link
              key={label}
              to={path}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-50/75 transition hover:bg-white/10 hover:text-white"
            >
              {content}
            </Link>
          ) : (
            <button key={label} type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emerald-50/35">
              {content}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{user?.name || 'User'}</p>
            <p className="truncate text-[10px] capitalize text-emerald-100/55">{user?.role?.replaceAll('_', ' ')}</p>
          </div>
          <button
            type="button"
            onClick={() => logout({ redirect: true })}
            className="rounded-lg p-1.5 text-emerald-100/60 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function TaskShell() {
  const { user } = useAuth();
  const { company } = useTenant();
  const { unreadCount, openDrawer } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const accessQuery = useQuery({
    queryKey: ['work-access-me'],
    queryFn: fetchMyWorkAccess,
    staleTime: 5 * 60 * 1000,
  });
  const canViewUsers = accessQuery.data?.user?.workAccess?.permissions?.viewUsers;
  const canCreateProjects = accessQuery.data?.user?.workAccess?.permissions?.manageProjects;
  const canApproveTasks = accessQuery.data?.user?.workAccess?.permissions?.approveTasks;
  const visibleNavigation = navigation.filter((item) => item.label !== 'Team' || canViewUsers);

  useEffect(() => {
    document.title = 'WorkFlow Hub';
  }, []);

  return (
    <div className="flex min-h-screen bg-surface-app text-content-primary">
      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar navItems={visibleNavigation} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <div className="relative h-full">
            <Sidebar mobile navItems={visibleNavigation} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-subtle bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-subtle p-2 text-content-secondary lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button className="hidden min-w-[250px] items-center gap-2 rounded-xl border border-subtle bg-surface-app px-3.5 py-2 text-sm text-content-tertiary sm:flex">
            <Search className="h-4 w-4" />
            <span>Search WorkFlow Hub</span>
            <kbd className="ml-auto rounded border border-subtle bg-surface px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={openDrawer}
              className="relative rounded-xl border border-subtle bg-surface p-2.5 text-content-secondary hover:text-content-primary"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[9px] font-bold leading-4 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-subtle bg-surface px-2.5 py-2 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-content-tertiary sm:block" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-4 pb-24 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<WorkOverviewPage user={user} company={company} canCreateProjects={canCreateProjects} canApproveTasks={canApproveTasks} />} />
            <Route path="workspaces" element={<WorkspacesPage />} />
            <Route path="workspaces/:workspaceId" element={<WorkspacesPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectsPage />} />
            <Route path="my-work" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<TasksPage />} />
            <Route path="board" element={<TaskBoardPage />} />
            <Route path="approvals" element={<ApprovalCenterPage />} />
            {canViewUsers && <Route path="team" element={<TeamAccessPage />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-subtle bg-surface px-2 py-2 lg:hidden">
          {[navigation[0], navigation[1], navigation[4], navigation[3]].map(({ label, icon: Icon, path, ready }) =>
            ready ? (
              <Link key={label} to={path} className="flex flex-col items-center gap-1 py-1 text-[10px] font-medium text-emerald-700">
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ) : (
              <button key={label} disabled className="flex flex-col items-center gap-1 py-1 text-[10px] font-medium text-content-tertiary">
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
