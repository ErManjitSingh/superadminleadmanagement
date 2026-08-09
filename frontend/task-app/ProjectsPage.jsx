import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FolderKanban,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  createProject,
  fetchMyWorkAccess,
  fetchProject,
  fetchProjects,
  fetchWorkspace,
  fetchWorkspaces,
  updateProject,
} from './api/workApi';
import TaskCreateModal from './TaskCreateModal';

const statusOptions = [
  ['planning', 'Planning'],
  ['not_started', 'Not started'],
  ['in_progress', 'In progress'],
  ['on_hold', 'On hold'],
  ['completed', 'Completed'],
  ['archived', 'Archived'],
];
const priorityOptions = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']];
const colors = ['#177245', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0f766e'];

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : 'Not set';
}

function dateInput(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function Avatar({ name }) {
  return <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-900">{(name || 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>;
}

function ProjectModal({ initialWorkspaceId, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    workspaceId: initialWorkspaceId || '',
    managerId: '',
    clientId: null,
    startDate: '',
    dueDate: '',
    priority: 'medium',
    status: 'planning',
    color: colors[0],
    icon: 'folder-kanban',
    tags: '',
    visibility: 'workspace',
    memberIds: [],
  });
  const workspacesQuery = useQuery({
    queryKey: ['workspaces', 'project-picker'],
    queryFn: () => fetchWorkspaces({ status: 'active', limit: 100 }),
  });
  const workspaceQuery = useQuery({
    queryKey: ['workspace', form.workspaceId],
    queryFn: () => fetchWorkspace(form.workspaceId),
    enabled: Boolean(form.workspaceId),
  });
  const mutation = useMutation({
    mutationFn: (payload) => createProject(payload),
    onSuccess: onCreated,
  });
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const members = workspaceQuery.data?.members || [];
  const managerOptions = members.filter((member) => member.role !== 'client_viewer' && member.userId);
  const clientOptions = members.filter((member) => member.userId);
  const toggleMember = (userId) => set(
    'memberIds',
    form.memberIds.includes(userId)
      ? form.memberIds.filter((id) => id !== userId)
      : [...form.memberIds, userId],
  );

  useEffect(() => {
    if (!form.managerId && managerOptions.length) set('managerId', managerOptions[0].userId._id);
  }, [form.managerId, managerOptions]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close project form" />
      <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-subtle bg-surface sm:max-w-3xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-subtle bg-surface px-5 py-4">
          <div><h2 className="font-bold">Create project</h2><p className="mt-0.5 text-xs text-content-tertiary">Set ownership, timeline, visibility, and initial team.</p></div>
          <button onClick={onClose} className="rounded-lg p-2 text-content-tertiary hover:bg-surface-app"><X className="h-4 w-4" /></button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({
              ...form,
              clientId: form.clientId || null,
              startDate: form.startDate ? new Date(`${form.startDate}T00:00:00.000Z`).toISOString() : null,
              dueDate: form.dueDate ? new Date(`${form.dueDate}T23:59:59.999Z`).toISOString() : null,
              tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
              memberIds: form.memberIds.filter((id) => id !== form.managerId && id !== form.clientId),
            });
          }}
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Project name</span>
              <input autoFocus required minLength={2} maxLength={160} value={form.name} onChange={(event) => set('name', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" placeholder="e.g. Website redesign" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Description</span>
              <textarea rows={3} maxLength={5000} value={form.description} onChange={(event) => set('description', event.target.value)} className="w-full resize-none rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="Project objective, scope, and expected outcome" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Workspace</span>
              <select required value={form.workspaceId} onChange={(event) => { setForm((current) => ({ ...current, workspaceId: event.target.value, managerId: '', clientId: null, memberIds: [] })); }} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">
                <option value="">Select workspace</option>
                {(workspacesQuery.data?.data || []).map((workspace) => <option key={workspace._id} value={workspace._id}>{workspace.name}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Project manager</span>
              <select required value={form.managerId} onChange={(event) => set('managerId', event.target.value)} disabled={!form.workspaceId} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm disabled:opacity-50">
                <option value="">Select manager</option>
                {managerOptions.map((member) => <option key={member.userId._id} value={member.userId._id}>{member.userId.name}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Client <span className="font-normal normal-case">(optional)</span></span>
              <select value={form.clientId || ''} onChange={(event) => set('clientId', event.target.value || null)} disabled={!form.workspaceId} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm disabled:opacity-50">
                <option value="">No client viewer</option>
                {clientOptions.map((member) => <option key={member.userId._id} value={member.userId._id}>{member.userId.name}</option>)}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Visibility</span>
              <select value={form.visibility} onChange={(event) => set('visibility', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">
                <option value="workspace">All workspace members</option>
                <option value="members">Project members only</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Start date</span>
              <input type="date" value={form.startDate} onChange={(event) => set('startDate', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Due date</span>
              <input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={(event) => set('dueDate', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Priority</span>
              <select value={form.priority} onChange={(event) => set('priority', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">{priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Status</span>
              <select value={form.status} onChange={(event) => set('status', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Tags <span className="font-normal normal-case">(comma separated)</span></span>
              <input maxLength={400} value={form.tags} onChange={(event) => set('tags', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" placeholder="development, website, urgent" />
            </label>
            <fieldset>
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-content-tertiary">Project color</legend>
              <div className="flex gap-2">{colors.map((color) => <button key={color} type="button" onClick={() => set('color', color)} className={`h-8 w-8 rounded-full border-2 ${form.color === color ? 'border-content-primary p-0.5' : 'border-transparent'}`}><span className="block h-full w-full rounded-full" style={{ backgroundColor: color }} /></button>)}</div>
            </fieldset>
            {members.length > 0 && (
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-content-tertiary">Initial team</legend>
                <div className="grid max-h-40 gap-1 overflow-y-auto rounded-xl border border-subtle p-2 sm:grid-cols-2">
                  {members.filter((member) => member.userId && member.userId._id !== form.managerId && member.userId._id !== form.clientId).map((member) => (
                    <label key={member._id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-surface-app">
                      <input type="checkbox" checked={form.memberIds.includes(member.userId._id)} onChange={() => toggleMember(member.userId._id)} className="accent-emerald-700" />
                      <Avatar name={member.userId.name} /><span className="truncate text-sm font-semibold">{member.userId.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {mutation.isError && <p className="sm:col-span-2 text-sm text-red-600">{mutation.error?.response?.data?.message || 'Project could not be created.'}</p>}
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-subtle bg-surface px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Cancel</button>
            <button disabled={mutation.isPending || !form.managerId} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{mutation.isPending ? 'Creating…' : 'Create project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HealthBadge({ health }) {
  const styles = {
    healthy: 'bg-emerald-50 text-emerald-700',
    at_risk: 'bg-amber-50 text-amber-700',
    delayed: 'bg-red-50 text-red-700',
  };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${styles[health] || styles.healthy}`}>{health.replace('_', ' ')}</span>;
}

function ProjectList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const workspaceId = searchParams.get('workspaceId') || '';
  const status = searchParams.get('status') || '';
  const showCreate = searchParams.get('create') === '1';
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const accessQuery = useQuery({ queryKey: ['work-access-me'], queryFn: fetchMyWorkAccess, staleTime: 300000 });
  const workspacesQuery = useQuery({ queryKey: ['workspaces', 'project-filter'], queryFn: () => fetchWorkspaces({ limit: 100, status: 'active' }) });
  const projectsQuery = useQuery({
    queryKey: ['projects', { search, workspaceId, status }],
    queryFn: () => fetchProjects({ search: search || undefined, workspaceId: workspaceId || undefined, status: status || undefined, limit: 50 }),
  });
  const canCreate = accessQuery.data?.user?.workAccess?.permissions?.manageProjects;
  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">Delivery</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1><p className="mt-2 text-sm text-content-secondary">Track ownership, progress, health, and deadlines across every workspace.</p></div>
        {canCreate && <button onClick={() => setParam('create', '1')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> New project</button>}
      </div>
      <div className="mt-6 grid gap-3 rounded-2xl border border-subtle bg-surface p-3 sm:grid-cols-[1fr_220px_180px]">
        <label className="flex h-11 items-center gap-2 rounded-xl border border-subtle bg-surface-app px-3"><Search className="h-4 w-4 text-content-tertiary" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search projects, keys, or tags" /></label>
        <select value={workspaceId} onChange={(event) => setParam('workspaceId', event.target.value)} className="h-11 rounded-xl border border-subtle bg-surface px-3 text-sm"><option value="">All workspaces</option>{(workspacesQuery.data?.data || []).map((workspace) => <option key={workspace._id} value={workspace._id}>{workspace.name}</option>)}</select>
        <select value={status} onChange={(event) => setParam('status', event.target.value)} className="h-11 rounded-xl border border-subtle bg-surface px-3 text-sm"><option value="">All statuses</option>{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {projectsQuery.isLoading ? (
        <div className="mt-6 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-subtle bg-surface" />)}</div>
      ) : projectsQuery.isError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{projectsQuery.error?.response?.data?.message || 'Projects could not be loaded.'}</div>
      ) : projectsQuery.data?.data?.length ? (
        <div className="mt-6 space-y-3">
          {projectsQuery.data.data.map((project) => (
            <Link key={project._id} to={`/projects/${project._id}`} className="group block rounded-2xl border border-subtle bg-surface p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-5">
              <div className="flex items-start gap-3">
                <span className="mt-1 h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold group-hover:text-emerald-800">{project.name}</h2><span className="rounded bg-surface-app px-2 py-1 text-[10px] font-bold text-content-tertiary">{project.key}</span><HealthBadge health={project.health} /></div>
                  <p className="mt-1 truncate text-xs text-content-tertiary">{project.workspaceId?.name} · {project.status.replaceAll('_', ' ')} · {project.priority} priority</p>
                  <div className="mt-4 grid gap-3 text-xs text-content-secondary sm:grid-cols-[180px_160px_1fr] sm:items-center">
                    <span className="flex items-center gap-2"><Avatar name={project.managerId?.name} /><span className="truncate"><span className="block text-[10px] text-content-tertiary">Manager</span>{project.managerId?.name}</span></span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDate(project.dueDate)}</span>
                    <span className="flex items-center gap-2"><span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-app"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${project.progress}%` }} /></span><b>{project.progress}%</b></span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-subtle bg-surface p-10 text-center"><FolderKanban className="mx-auto h-10 w-10 text-emerald-700" /><h2 className="mt-4 text-lg font-bold">No projects found</h2><p className="mt-2 text-sm text-content-secondary">Create a project or adjust the current filters.</p></div>
      )}
      {showCreate && <ProjectModal initialWorkspaceId={workspaceId} onClose={() => setParam('create', '')} onCreated={(project) => { queryClient.invalidateQueries({ queryKey: ['projects'] }); navigate(`/projects/${project._id}`); }} />}
    </>
  );
}

function Metric({ icon: Icon, label, value, tone = 'emerald' }) {
  const tones = { emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700', red: 'bg-red-50 text-red-700' };
  return <div className="rounded-2xl border border-subtle bg-surface p-4"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></span><p className="mt-3 text-xs font-semibold text-content-tertiary">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const projectQuery = useQuery({ queryKey: ['project', projectId], queryFn: () => fetchProject(projectId) });
  const project = projectQuery.data;
  const statusMutation = useMutation({
    mutationFn: (status) => updateProject(projectId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  const timeline = useMemo(() => {
    if (!project?.startDate || !project?.dueDate) return null;
    const total = new Date(project.dueDate) - new Date(project.startDate);
    const elapsed = Date.now() - new Date(project.startDate);
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  }, [project]);

  if (projectQuery.isLoading) return <div className="h-72 animate-pulse rounded-2xl border border-subtle bg-surface" />;
  if (projectQuery.isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{projectQuery.error?.response?.data?.message || 'Project could not be loaded.'}</div>;
  return (
    <>
      <button onClick={() => navigate('/projects')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-content-secondary"><ArrowLeft className="h-4 w-4" /> All projects</button>
      <section className="overflow-hidden rounded-2xl border border-subtle bg-surface">
        <div className="h-2" style={{ backgroundColor: project.color }} />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-surface-app px-2 py-1 text-[10px] font-bold text-content-tertiary">{project.key}</span><HealthBadge health={project.health} /><span className="rounded-full bg-surface-app px-2.5 py-1 text-[10px] font-bold uppercase text-content-tertiary">{project.priority}</span></div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
            <p className="mt-2 text-sm text-content-secondary">{project.workspaceId?.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/board?projectId=${projectId}`} className="inline-flex h-11 items-center rounded-xl border border-subtle bg-surface px-3.5 text-sm font-semibold">Open board</Link>
            {project.access.canManage && !['completed', 'archived'].includes(project.status) && <button onClick={() => setShowCreateTask(true)} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Task</button>}
            {project.access.canManage && <select value={project.status} onChange={(event) => statusMutation.mutate(event.target.value)} disabled={statusMutation.isPending} className="h-11 rounded-xl border border-subtle bg-surface px-3 text-sm font-semibold">{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
          </div>
        </div>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} label="Completion" value={`${project.progress}%`} />
        <Metric icon={CalendarDays} label="Due date" value={formatDate(project.dueDate)} tone={project.health === 'delayed' ? 'red' : 'blue'} />
        <Metric icon={Users} label="Project team" value={`${project.memberCount} members`} tone="blue" />
        <Metric icon={project.health === 'healthy' ? CheckCircle2 : CircleAlert} label="Project health" value={project.health.replace('_', ' ')} tone={project.health === 'healthy' ? 'emerald' : project.health === 'delayed' ? 'red' : 'amber'} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-subtle bg-surface p-5 sm:p-6"><h2 className="font-bold">Overview</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-content-secondary">{project.description || 'No project description yet.'}</p>{project.tags?.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{project.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">#{tag}</span>)}</div>}</section>
          <section className="rounded-2xl border border-subtle bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-emerald-700" /><h2 className="font-bold">Timeline</h2></div>
            <div className="mt-5 flex justify-between text-xs text-content-tertiary"><span>{formatDate(project.startDate)}</span><span>{formatDate(project.dueDate)}</span></div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-app"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${timeline ?? project.progress}%` }} /></div>
            <p className="mt-3 text-xs text-content-secondary">{timeline == null ? 'Add both project dates to track schedule elapsed.' : `${timeline}% of scheduled time elapsed.`}</p>
          </section>
        </div>
        <section className="rounded-2xl border border-subtle bg-surface">
          <div className="border-b border-subtle px-5 py-4"><h2 className="font-bold">Project team</h2><p className="mt-1 text-xs text-content-tertiary">Project-level access</p></div>
          <div className="divide-y divide-subtle">{project.members.map((member) => <div key={member._id} className="flex items-center gap-3 p-4"><Avatar name={member.userId?.name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.userId?.name || 'Unavailable user'}</p><p className="truncate text-xs capitalize text-content-tertiary">{member.role.replaceAll('_', ' ')}</p></div></div>)}</div>
          <div className="border-t border-subtle p-4 text-xs text-content-tertiary">Manager: <b className="text-content-secondary">{project.managerId?.name}</b>{project.clientId && <> · Client: <b className="text-content-secondary">{project.clientId.name}</b></>}</div>
        </section>
      </div>
      {showCreateTask && <TaskCreateModal initialProjectId={projectId} onClose={() => setShowCreateTask(false)} onCreated={() => { setShowCreateTask(false); queryClient.invalidateQueries({ queryKey: ['projects'] }); queryClient.invalidateQueries({ queryKey: ['task-board', projectId] }); }} />}
    </>
  );
}

export default function ProjectsPage() {
  const { projectId } = useParams();
  return projectId ? <ProjectDetail /> : <ProjectList />;
}
