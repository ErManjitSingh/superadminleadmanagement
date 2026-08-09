import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import {
  createWorkUser,
  fetchMyWorkAccess,
  fetchWorkUsers,
  generateWorkUserTemporaryPassword,
  updateWorkUserAccess,
} from './api/workApi';

function InviteUserModal({ configuration, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    disciplines: [],
    jobTitle: '',
  });
  const [result, setResult] = useState(null);

  const mutation = useMutation({
    mutationFn: createWorkUser,
    onSuccess: (data) => {
      setResult(data);
      onCreated();
    },
  });

  const inviteUrl = result
    ? `${window.location.origin}${import.meta.env.BASE_URL}accept-invite/${result.inviteToken}`
    : '';

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleDiscipline = (value) => set(
    'disciplines',
    form.disciplines.includes(value)
      ? form.disciplines.filter((item) => item !== value)
      : [...form.disciplines, value],
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close invitation form" />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-subtle bg-surface sm:max-w-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-subtle bg-surface px-5 py-4">
          <div>
            <h2 className="font-bold text-content-primary">Invite team member</h2>
            <p className="mt-0.5 text-xs text-content-tertiary">Create secure WorkFlow Hub-only access.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-content-tertiary hover:bg-surface-elevated"><X className="h-4 w-4" /></button>
        </div>

        {result ? (
          <div className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Check className="h-5 w-5" /></div>
            <h3 className="mt-4 text-lg font-bold text-content-primary">Invitation created</h3>
            <p className="mt-2 text-sm text-content-secondary">Share this secure link with {result.user.name}. It expires in 7 days.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-subtle bg-surface-app p-2">
              <input readOnly value={inviteUrl} className="min-w-0 flex-1 bg-transparent px-2 text-xs text-content-secondary outline-none" />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(inviteUrl)}
                className="rounded-lg border border-subtle bg-surface p-2 text-content-secondary"
                aria-label="Copy invitation link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <button onClick={onClose} className="mt-6 w-full rounded-xl bg-emerald-800 py-2.5 text-sm font-bold text-white">Done</button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate(form);
            }}
          >
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Full name</span>
                <input required minLength={2} maxLength={120} value={form.name} onChange={(event) => set('name', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Email</span>
                <input required type="email" maxLength={254} value={form.email} onChange={(event) => set('email', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Access role</span>
                <select value={form.role} onChange={(event) => set('role', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600">
                  {configuration.roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Job title</span>
                <input maxLength={100} value={form.jobTitle} onChange={(event) => set('jobTitle', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" />
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-content-tertiary">Disciplines</legend>
                <div className="flex flex-wrap gap-2">
                  {configuration.disciplines.map((option) => {
                    const selected = form.disciplines.includes(option.value);
                    return (
                      <button key={option.value} type="button" onClick={() => toggleDiscipline(option.value)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-subtle text-content-secondary'}`}>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {mutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                  {mutation.error?.response?.data?.message || 'Unable to create invitation.'}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-subtle px-5 py-4">
              <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold text-content-secondary">Cancel</button>
              <button disabled={mutation.isPending} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {mutation.isPending ? 'Creating…' : 'Create invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AccessEditor({ user, configuration, onClose, onSave, saving, error }) {
  const [role, setRole] = useState(user.workAccess.role);
  const [enabled, setEnabled] = useState(user.workAccess.enabled);
  const [jobTitle, setJobTitle] = useState(user.workAccess.jobTitle || '');
  const [disciplines, setDisciplines] = useState(user.workAccess.disciplines || []);

  const toggleDiscipline = (value) => {
    setDisciplines((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close access editor" />
      <form
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-subtle bg-surface sm:max-w-xl sm:rounded-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ role, enabled, jobTitle: jobTitle.trim(), disciplines });
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-subtle bg-surface px-5 py-4">
          <div>
            <h2 className="font-bold text-content-primary">Manage WorkFlow Hub access</h2>
            <p className="mt-0.5 text-xs text-content-tertiary">{user.name} · {user.email}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-content-tertiary hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <label className="flex items-center justify-between gap-4 rounded-xl border border-subtle bg-surface-app p-4">
            <div>
              <p className="text-sm font-semibold text-content-primary">Product access</p>
              <p className="mt-1 text-xs text-content-tertiary">Disabled users cannot open WorkFlow Hub.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((value) => !value)}
              className={`relative h-6 w-11 rounded-full transition ${enabled ? 'bg-emerald-700' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Access role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm text-content-primary outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            >
              {configuration.roles.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Job title</span>
            <input
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              maxLength={100}
              placeholder="e.g. Senior SEO Executive"
              className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm text-content-primary outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15"
            />
          </label>

          <fieldset>
            <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-content-tertiary">Professional disciplines</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {configuration.disciplines.map((option) => {
                const selected = disciplines.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDiscipline(option.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      selected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-subtle bg-surface text-content-secondary hover:border-emerald-300'
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300'}`}>
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error.response?.data?.message || 'Unable to update access.'}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-subtle bg-surface px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold text-content-secondary">
            Cancel
          </button>
          <button disabled={saving} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save access'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TemporaryPasswordModal({ user, onClose, onGenerated }) {
  const [result, setResult] = useState(null);
  const mutation = useMutation({
    mutationFn: () => generateWorkUserTemporaryPassword(user._id),
    onSuccess: (data) => {
      setResult(data);
      onGenerated();
    },
  });
  const copyCredentials = () => navigator.clipboard?.writeText(
    `WorkFlow Hub Login\nEmail: ${result.loginId}\nTemporary password: ${result.temporaryPassword}\nURL: ${window.location.origin}${import.meta.env.BASE_URL}login`,
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close temporary password dialog" />
      <div className="relative w-full rounded-t-2xl border border-subtle bg-surface sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <div>
            <h2 className="font-bold text-content-primary">Team login credentials</h2>
            <p className="mt-0.5 text-xs text-content-tertiary">{user.name} · {user.email}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-content-tertiary hover:bg-surface-app"><X className="h-4 w-4" /></button>
        </div>
        {result ? (
          <div className="p-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              This password is shown only once. Copy it now and share it privately with the user.
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-subtle bg-surface-app p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Login ID / Email</p>
                <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-sm font-bold text-content-primary">{result.loginId}</code><button onClick={() => navigator.clipboard?.writeText(result.loginId)} className="rounded-lg border border-subtle bg-surface p-2"><Copy className="h-3.5 w-3.5" /></button></div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Temporary password</p>
                <div className="mt-1 flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-sm font-black text-emerald-900">{result.temporaryPassword}</code><button onClick={() => navigator.clipboard?.writeText(result.temporaryPassword)} className="rounded-lg border border-emerald-200 bg-white p-2"><Copy className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
            <button onClick={copyCredentials} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><Copy className="h-4 w-4" /> Copy complete login details</button>
            <button onClick={onClose} className="mt-2 w-full rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Done</button>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-800"><KeyRound className="h-5 w-5" /></div>
            <h3 className="mt-4 font-bold text-content-primary">Generate a new temporary password?</h3>
            <p className="mt-2 text-sm leading-6 text-content-secondary">The user’s current password will stop working. Existing passwords can never be viewed or recovered.</p>
            {mutation.isError && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{mutation.error?.response?.data?.message || 'Unable to generate password.'}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{mutation.isPending ? 'Generating…' : 'Generate password'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-[70px] animate-pulse rounded-xl bg-surface-elevated" />
      ))}
    </div>
  );
}

export default function TeamAccessPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const accessQuery = useQuery({
    queryKey: ['work-access-me'],
    queryFn: fetchMyWorkAccess,
    staleTime: 5 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ['work-users', { page, search: debouncedSearch, role }],
    queryFn: () => fetchWorkUsers({
      page,
      limit: 25,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(role ? { role } : {}),
    }),
    keepPreviousData: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateWorkUserAccess(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-users'] });
      queryClient.invalidateQueries({ queryKey: ['work-access-me'] });
      setEditingUser(null);
    },
  });

  const configuration = accessQuery.data?.configuration;
  const canManageUsers = accessQuery.data?.user?.workAccess?.permissions?.manageUsers;
  const currentUserId = accessQuery.data?.user?._id;
  const users = usersQuery.data?.data || [];
  const stats = usersQuery.data?.stats;
  const pagination = usersQuery.data?.pagination;

  const roleOptions = useMemo(() => configuration?.roles || [], [configuration]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-content-primary sm:text-3xl">Team & access</h1>
          <p className="mt-2 text-sm text-content-secondary">Control who can access WorkFlow Hub and what they can manage.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-subtle bg-surface px-3 py-2 text-xs font-semibold text-content-secondary sm:flex">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Tenant-scoped access
          </div>
          {canManageUsers && (
            <button onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white">
              <Plus className="h-4 w-4" />
              Invite user
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['Total users', stats.total, Users],
            ['Active access', stats.active, ShieldCheck],
            ['Access disabled', stats.workDisabled, UserCog],
          ].map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-subtle bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-content-tertiary">{label}</p>
                <Icon className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="mt-3 text-2xl font-bold text-content-primary">{value}</p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-subtle bg-surface">
        <div className="flex flex-col gap-3 border-b border-subtle p-4 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or job title"
              className="h-10 w-full rounded-xl border border-subtle bg-surface-app pl-9 pr-3 text-sm text-content-primary outline-none focus:border-emerald-600"
            />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              className="h-10 min-w-[190px] rounded-xl border border-subtle bg-surface pl-9 pr-8 text-sm text-content-primary outline-none focus:border-emerald-600"
            >
              <option value="">All access roles</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="p-3 sm:p-4">
          {(usersQuery.isLoading || accessQuery.isLoading) && <UserSkeleton />}

          {usersQuery.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {usersQuery.error?.response?.data?.message || 'Unable to load users.'}
            </div>
          )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
            <div className="py-14 text-center">
              <Users className="mx-auto h-9 w-9 text-content-tertiary" />
              <h2 className="mt-3 font-bold text-content-primary">No users found</h2>
              <p className="mt-1 text-sm text-content-secondary">Try changing the search or access-role filter.</p>
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-2">
              {users.map((item) => (
                <div key={item._id} className="flex flex-col gap-3 rounded-xl border border-subtle p-3.5 transition hover:bg-surface-app sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-content-primary">{item.name}</p>
                      <p className="text-[9px] font-bold uppercase tracking-wide text-content-tertiary">Login ID</p>
                      <p className="truncate text-xs font-semibold text-content-secondary">{item.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:flex sm:w-[540px] sm:items-center">
                    <div className="min-w-0 sm:w-[150px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">Role</p>
                      <p className="mt-1 truncate text-xs font-semibold text-content-primary">{item.workAccess.roleLabel}</p>
                    </div>
                    <div className="min-w-0 sm:w-[160px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">Discipline</p>
                      <p className="mt-1 truncate text-xs text-content-secondary">
                        {item.workAccess.disciplineLabels.join(', ') || item.workAccess.jobTitle || 'Not assigned'}
                      </p>
                    </div>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      item.workAccess.enabled && item.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.workAccess.enabled && item.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                    {canManageUsers && item._id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => setPasswordUser(item)}
                        className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                      >
                        <span className="inline-flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> Login</span>
                      </button>
                    )}
                    {canManageUsers && (
                      <button
                        type="button"
                        onClick={() => {
                          updateMutation.reset();
                          setEditingUser(item);
                        }}
                        className="ml-auto rounded-lg border border-subtle px-3 py-2 text-xs font-semibold text-content-secondary hover:border-emerald-300 hover:text-emerald-800"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-subtle px-4 py-3">
            <p className="text-xs text-content-tertiary">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-subtle p-2 text-content-secondary disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-subtle p-2 text-content-secondary disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {editingUser && configuration && (
        <AccessEditor
          user={editingUser}
          configuration={configuration}
          saving={updateMutation.isPending}
          error={updateMutation.error}
          onClose={() => setEditingUser(null)}
          onSave={(payload) => updateMutation.mutate({ userId: editingUser._id, payload })}
        />
      )}

      {inviteOpen && configuration && (
        <InviteUserModal
          configuration={configuration}
          onClose={() => setInviteOpen(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['work-users'] })}
        />
      )}

      {passwordUser && (
        <TemporaryPasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onGenerated={() => queryClient.invalidateQueries({ queryKey: ['work-users'] })}
        />
      )}
    </div>
  );
}
