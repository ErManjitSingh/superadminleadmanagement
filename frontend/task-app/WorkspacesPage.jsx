import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import {
  addWorkspaceMember,
  createWorkspace,
  fetchMyWorkAccess,
  fetchProjects,
  fetchWorkspace,
  fetchWorkspaces,
  fetchWorkUsers,
  removeWorkspaceMember,
  updateWorkspace,
} from './api/workApi';

const colors = ['#177245', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0f766e'];

function Initials({ name, className = '' }) {
  return (
    <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-900 ${className}`}>
      {(name || 'U').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
    </span>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close dialog" />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-subtle bg-surface sm:max-w-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-subtle bg-surface px-5 py-4">
          <div>
            <h2 className="font-bold text-content-primary">{title}</h2>
            <p className="mt-0.5 text-xs text-content-tertiary">{subtitle}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-content-tertiary hover:bg-surface-elevated"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: colors[0],
    icon: 'briefcase',
    memberIds: [],
  });
  const usersQuery = useQuery({
    queryKey: ['work-users', 'workspace-picker'],
    queryFn: () => fetchWorkUsers({ limit: 100, enabled: 'true' }),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => onCreated(workspace),
  });
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleMember = (userId) => set(
    'memberIds',
    form.memberIds.includes(userId)
      ? form.memberIds.filter((id) => id !== userId)
      : [...form.memberIds, userId],
  );

  return (
    <ModalShell title="Create workspace" subtitle="Organize related projects, people, files, and activity." onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Workspace name</span>
            <input autoFocus required minLength={2} maxLength={120} value={form.name} onChange={(event) => set('name', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" placeholder="e.g. India Holiday Destinations" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Description</span>
            <textarea rows={3} maxLength={1000} value={form.description} onChange={(event) => set('description', event.target.value)} className="w-full resize-none rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="What work belongs in this workspace?" />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Icon</span>
            <select value={form.icon} onChange={(event) => set('icon', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none">
              <option value="briefcase">Business</option>
              <option value="code">Development</option>
              <option value="palette">Design</option>
              <option value="megaphone">Marketing</option>
              <option value="building">Client work</option>
            </select>
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-content-tertiary">Color</legend>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button key={color} type="button" onClick={() => set('color', color)} className={`h-8 w-8 rounded-full border-2 ${form.color === color ? 'border-content-primary p-0.5' : 'border-transparent'}`} aria-label={`Use ${color}`}>
                  <span className="block h-full w-full rounded-full" style={{ backgroundColor: color }} />
                </button>
              ))}
            </div>
          </fieldset>
          {usersQuery.data?.data?.length > 0 && (
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-content-tertiary">Add members now <span className="font-normal normal-case">(optional)</span></legend>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-subtle p-2">
                {usersQuery.data.data.map((user) => (
                  <label key={user._id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-app">
                    <input type="checkbox" checked={form.memberIds.includes(user._id)} onChange={() => toggleMember(user._id)} className="accent-emerald-700" />
                    <Initials name={user.name} />
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block truncate text-xs text-content-tertiary">{user.email}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {mutation.isError && <p className="sm:col-span-2 text-sm text-red-600">{mutation.error?.response?.data?.message || 'Workspace could not be created.'}</p>}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-subtle bg-surface px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Cancel</button>
          <button disabled={mutation.isPending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{mutation.isPending ? 'Creating…' : 'Create workspace'}</button>
        </div>
      </form>
    </ModalShell>
  );
}

function WorkspaceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState('active');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const accessQuery = useQuery({ queryKey: ['work-access-me'], queryFn: fetchMyWorkAccess, staleTime: 300000 });
  const workspacesQuery = useQuery({
    queryKey: ['workspaces', { search, status }],
    queryFn: () => fetchWorkspaces({ search: search || undefined, status, limit: 50 }),
  });
  const canCreate = accessQuery.data?.user?.workAccess?.permissions?.createWorkspaces;
  const workspaces = workspacesQuery.data?.data || [];

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Organization</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Workspaces</h1>
          <p className="mt-2 text-sm text-content-secondary">Keep client, internal, and specialist delivery work clearly separated.</p>
        </div>
        {canCreate && <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> New workspace</button>}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-subtle bg-surface p-3 sm:flex-row">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-subtle bg-surface-app px-3">
          <Search className="h-4 w-4 text-content-tertiary" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search workspaces" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-subtle bg-surface px-3 text-sm">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {workspacesQuery.isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl border border-subtle bg-surface" />)}</div>
      ) : workspacesQuery.isError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{workspacesQuery.error?.response?.data?.message || 'Workspaces could not be loaded.'}</div>
      ) : workspaces.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link key={workspace._id} to={`/workspaces/${workspace._id}`} className="group overflow-hidden rounded-2xl border border-subtle bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="h-1.5" style={{ backgroundColor: workspace.color }} />
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: workspace.color }}><BriefcaseBusiness className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-content-primary group-hover:text-emerald-800">{workspace.name}</h2>
                    <p className="mt-1 text-xs text-content-tertiary">Owned by {workspace.ownerId?.name || 'Administrator'}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-content-secondary">{workspace.description || 'No workspace description yet.'}</p>
                <div className="mt-5 flex items-center gap-4 border-t border-subtle pt-4 text-xs font-semibold text-content-secondary">
                  <span className="flex items-center gap-1.5"><FolderKanban className="h-4 w-4" />{workspace.projectCount} projects</span>
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{workspace.memberCount} members</span>
                  {workspace.status === 'archived' && <Archive className="ml-auto h-4 w-4" />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-subtle bg-surface p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-emerald-700" />
          <h2 className="mt-4 text-lg font-bold">No workspaces found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-content-secondary">{search ? 'Try a different search.' : 'Create the first workspace to organize projects and people.'}</p>
          {canCreate && !search && <button onClick={() => setShowCreate(true)} className="mt-5 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">Create workspace</button>}
        </div>
      )}
      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} onCreated={(workspace) => { queryClient.invalidateQueries({ queryKey: ['workspaces'] }); navigate(`/workspaces/${workspace._id}`); }} />}
    </>
  );
}

function AddWorkspaceMemberModal({ workspace, onClose, onAdded }) {
  const existing = new Set(workspace.members.map((member) => member.userId?._id));
  const usersQuery = useQuery({
    queryKey: ['work-users', 'workspace-add'],
    queryFn: () => fetchWorkUsers({ limit: 100, enabled: 'true' }),
  });
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const mutation = useMutation({
    mutationFn: () => addWorkspaceMember(workspace._id, { userId, role }),
    onSuccess: onAdded,
  });
  const available = (usersQuery.data?.data || []).filter((user) => !existing.has(user._id));
  return (
    <ModalShell title="Add workspace member" subtitle="Members can only access workspaces assigned to them." onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }} className="p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">User</span>
          <select required value={userId} onChange={(event) => setUserId(event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">
            <option value="">Select a user</option>
            {available.map((user) => <option key={user._id} value={user._id}>{user.name} — {user.email}</option>)}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Workspace role</span>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">
            <option value="admin">Workspace admin</option>
            <option value="project_manager">Project manager</option>
            <option value="team_leader">Team leader</option>
            <option value="member">Member</option>
            <option value="client_viewer">Client / viewer</option>
          </select>
        </label>
        {mutation.isError && <p className="mt-4 text-sm text-red-600">{mutation.error?.response?.data?.message || 'Member could not be added.'}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Cancel</button>
          <button disabled={!userId || mutation.isPending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Add member</button>
        </div>
      </form>
    </ModalShell>
  );
}

function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showMember, setShowMember] = useState(false);
  const workspaceQuery = useQuery({ queryKey: ['workspace', workspaceId], queryFn: () => fetchWorkspace(workspaceId) });
  const projectsQuery = useQuery({
    queryKey: ['projects', { workspaceId }],
    queryFn: () => fetchProjects({ workspaceId, limit: 12 }),
  });
  const archiveMutation = useMutation({
    mutationFn: () => updateWorkspace(workspaceId, { status: workspaceQuery.data.status === 'archived' ? 'active' : 'archived' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] }),
  });
  const removeMutation = useMutation({
    mutationFn: (userId) => removeWorkspaceMember(workspaceId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] }),
  });
  const workspace = workspaceQuery.data;

  if (workspaceQuery.isLoading) return <div className="h-72 animate-pulse rounded-2xl border border-subtle bg-surface" />;
  if (workspaceQuery.isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{workspaceQuery.error?.response?.data?.message || 'Workspace could not be loaded.'}</div>;

  return (
    <>
      <button onClick={() => navigate('/workspaces')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-content-secondary hover:text-content-primary"><ArrowLeft className="h-4 w-4" /> All workspaces</button>
      <section className="overflow-hidden rounded-2xl border border-subtle bg-surface">
        <div className="h-2" style={{ backgroundColor: workspace.color }} />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: workspace.color }}><BriefcaseBusiness className="h-6 w-6" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
                <span className="rounded-full bg-surface-app px-2.5 py-1 text-[10px] font-bold uppercase text-content-tertiary">{workspace.status}</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-content-secondary">{workspace.description || 'No description provided.'}</p>
              <p className="mt-3 text-xs text-content-tertiary">{workspace.projectCount} projects · {workspace.memberCount} members · Your role: {workspace.access.membershipRole || 'Work admin'}</p>
            </div>
          </div>
          {workspace.access.canManage && (
            <div className="flex gap-2">
              <button onClick={() => setShowMember(true)} className="inline-flex items-center gap-2 rounded-xl border border-subtle px-3.5 py-2.5 text-sm font-semibold"><Users className="h-4 w-4" /> Add member</button>
              <button onClick={() => archiveMutation.mutate()} className="rounded-xl border border-subtle px-3.5 py-2.5 text-sm font-semibold">{workspace.status === 'archived' ? 'Restore' : 'Archive'}</button>
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-subtle bg-surface">
          <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
            <div><h2 className="font-bold">Projects</h2><p className="mt-1 text-xs text-content-tertiary">Active delivery inside this workspace</p></div>
            {workspace.access.canCreateProject && <Link to={`/projects?workspaceId=${workspaceId}&create=1`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Project</Link>}
          </div>
          <div className="divide-y divide-subtle">
            {(projectsQuery.data?.data || []).map((project) => (
              <Link key={project._id} to={`/projects/${project._id}`} className="flex items-center gap-3 p-4 hover:bg-surface-app">
                <span className="h-9 w-1 rounded-full" style={{ backgroundColor: project.color }} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{project.name}</p><p className="mt-1 text-xs text-content-tertiary">{project.key} · {project.status.replaceAll('_', ' ')}</p></div>
                <span className="text-xs font-semibold text-content-secondary">{project.progress}%</span>
              </Link>
            ))}
            {!projectsQuery.isLoading && !projectsQuery.data?.data?.length && <div className="p-8 text-center text-sm text-content-secondary">No projects in this workspace yet.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-subtle bg-surface">
          <div className="border-b border-subtle px-5 py-4"><h2 className="font-bold">Members</h2><p className="mt-1 text-xs text-content-tertiary">Workspace-level access</p></div>
          <div className="max-h-[520px] divide-y divide-subtle overflow-y-auto">
            {workspace.members.map((member) => (
              <div key={member._id} className="flex items-center gap-3 p-4">
                <Initials name={member.userId?.name} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.userId?.name || 'Unavailable user'}</p><p className="truncate text-xs capitalize text-content-tertiary">{member.role.replaceAll('_', ' ')}</p></div>
                {workspace.access.canManage && member.role !== 'owner' && <button onClick={() => removeMutation.mutate(member.userId?._id)} className="rounded-lg p-1.5 text-content-tertiary hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${member.userId?.name}`}><X className="h-4 w-4" /></button>}
              </div>
            ))}
          </div>
        </section>
      </div>
      {showMember && <AddWorkspaceMemberModal workspace={workspace} onClose={() => setShowMember(false)} onAdded={() => { setShowMember(false); queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] }); }} />}
    </>
  );
}

export default function WorkspacesPage() {
  const { workspaceId } = useParams();
  return workspaceId ? <WorkspaceDetail /> : <WorkspaceList />;
}
