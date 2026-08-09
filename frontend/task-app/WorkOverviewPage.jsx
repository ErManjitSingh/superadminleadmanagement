import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckSquare2, ClipboardCheck, FolderKanban } from 'lucide-react';
import { fetchApprovals, fetchProjects, fetchTasks } from './api/workApi';

export default function WorkOverviewPage({ user, company, canCreateProjects, canApproveTasks }) {
  const projectsQuery = useQuery({
    queryKey: ['projects', 'overview'],
    queryFn: () => fetchProjects({ limit: 8 }),
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', 'overview', 'mine'],
    queryFn: () => fetchTasks({ mine: 'true', limit: 8 }),
  });
  const approvalsQuery = useQuery({
    queryKey: ['approvals', 'overview', 'pending'],
    queryFn: () => fetchApprovals({ status: 'pending', limit: 1 }),
  });
  const projects = projectsQuery.data?.data || [];
  const tasks = tasksQuery.data?.data || [];
  const activeProjects = projects.filter((project) => !['completed', 'archived'].includes(project.status));
  const activeTasks = tasks.filter((task) => task.status !== 'completed');
  const overdueTasks = activeTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date());

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">WorkFlow Hub</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Good morning, {user?.name?.split(' ')[0] || 'there'}</h1>
          <p className="mt-2 text-sm text-content-secondary">{company?.name ? `${company.name} delivery overview.` : 'Company delivery overview.'}</p>
        </div>
        {canCreateProjects && <Link to="/projects?create=1" className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">Create project <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [FolderKanban, 'Active projects', activeProjects.length, 'bg-blue-50 text-blue-700'],
          [CheckSquare2, 'My active tasks', activeTasks.length, 'bg-violet-50 text-violet-700'],
          [AlertTriangle, 'My overdue tasks', overdueTasks.length, 'bg-red-50 text-red-700'],
          [ClipboardCheck, canApproveTasks ? 'Awaiting approval' : 'My submitted reviews', approvalsQuery.data?.pagination?.total ?? '—', 'bg-emerald-50 text-emerald-700'],
        ].map(([Icon, label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-subtle bg-surface p-5 shadow-sm">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
            <p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-xs font-semibold text-content-tertiary">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-subtle bg-surface">
          <div className="flex items-center justify-between border-b border-subtle px-5 py-4"><div><h2 className="font-bold">Project health</h2><p className="mt-1 text-xs text-content-tertiary">Your recently updated projects</p></div><Link to="/projects" className="text-xs font-bold text-emerald-700">View all</Link></div>
          <div className="divide-y divide-subtle">
            {projects.slice(0, 6).map((project) => (
              <Link key={project._id} to={`/projects/${project._id}`} className="flex items-center gap-3 p-4 hover:bg-surface-app">
                <span className="h-9 w-1 rounded-full" style={{ backgroundColor: project.color }} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{project.name}</p><p className="mt-1 truncate text-xs text-content-tertiary">{project.workspaceId?.name} · {project.managerId?.name}</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${project.health === 'delayed' ? 'bg-red-50 text-red-700' : project.health === 'at_risk' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{project.health.replace('_', ' ')}</span>
              </Link>
            ))}
            {!projectsQuery.isLoading && !projects.length && <div className="p-8 text-center text-sm text-content-secondary">No projects are available yet.</div>}
          </div>
        </section>
        <section className="rounded-2xl border border-subtle bg-surface">
          <div className="flex items-center justify-between border-b border-subtle px-5 py-4"><div><h2 className="font-bold">My tasks</h2><p className="mt-1 text-xs text-content-tertiary">Assigned work needing attention</p></div><Link to="/my-work" className="text-xs font-bold text-emerald-700">View all</Link></div>
          <div className="divide-y divide-subtle">
            {tasks.slice(0, 6).map((task) => (
              <Link key={task._id} to={`/tasks/${task._id}`} className="flex items-center gap-3 p-4 hover:bg-surface-app"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${task.status === 'review' ? 'bg-violet-500' : task.status === 'in_progress' ? 'bg-amber-500' : task.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{task.title}</p><p className="mt-1 truncate text-xs text-content-tertiary">{task.projectId?.name} · {task.status.replaceAll('_', ' ')}</p></div>{task.dueDate && <span className="text-[10px] font-semibold text-content-tertiary">{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(task.dueDate))}</span>}</Link>
            ))}
            {!tasksQuery.isLoading && !tasks.length && <div className="p-8 text-center text-sm text-content-secondary">No tasks are assigned to you.</div>}
          </div>
        </section>
      </div>
    </>
  );
}
