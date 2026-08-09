import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bug,
  CalendarDays,
  CheckCircle2,
  CheckSquare2,
  Circle,
  Clock3,
  Plus,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  createSubTask,
  deleteSubTask,
  fetchMyWorkAccess,
  fetchTask,
  fetchTasks,
  updateSubTask,
  updateTask,
} from './api/workApi';
import TaskCreateModal from './TaskCreateModal';
import TaskCollaborationPanels from './TaskCollaborationPanels';

const statuses = [
  ['backlog', 'Backlog'],
  ['todo', 'To do'],
  ['in_progress', 'In progress'],
  ['review', 'Review'],
  ['approved', 'Approved'],
  ['completed', 'Completed'],
];
const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

function formatDate(value, fallback = 'Not set') {
  return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : fallback;
}

function formatPayment(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
}

function Avatar({ user }) {
  return <span title={user?.name} className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-900">{user?.name?.charAt(0) || '?'}</span>;
}

function MyWorkList() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const accessQuery = useQuery({ queryKey: ['work-access-me'], queryFn: fetchMyWorkAccess, staleTime: 300000 });
  const tasksQuery = useQuery({
    queryKey: ['tasks', 'mine', search],
    queryFn: () => fetchTasks({ mine: 'true', search: search || undefined, limit: 100 }),
  });
  const tasks = tasksQuery.data?.data || [];
  const filtered = tasks.filter((task) => {
    if (tab === 'active') return !['completed', 'approved'].includes(task.status);
    if (tab === 'overdue') return isOverdue(task);
    return task.status === tab;
  });
  const canCreate = accessQuery.data?.user?.workAccess?.permissions?.createTasks;
  const counts = {
    active: tasks.filter((task) => !['completed', 'approved'].includes(task.status)).length,
    in_progress: tasks.filter((task) => task.status === 'in_progress').length,
    review: tasks.filter((task) => task.status === 'review').length,
    overdue: tasks.filter(isOverdue).length,
    completed: tasks.filter((task) => task.status === 'completed').length,
  };
  const expectedPayment = tasks
    .filter((task) => task.status !== 'completed')
    .reduce((total, task) => total + Number(task.paymentAmount || 0), 0);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">Personal workspace</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">My Work</h1><p className="mt-2 text-sm text-content-secondary">Everything assigned to you, prioritized by delivery status and deadline.</p></div>
        {canCreate && <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> New task</button>}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ['active', 'Active', counts.active],
          ['in_progress', 'In progress', counts.in_progress],
          ['review', 'In review', counts.review],
          ['overdue', 'Overdue', counts.overdue],
          ['completed', 'Completed', counts.completed],
        ].map(([value, label, count]) => (
          <button key={value} onClick={() => setTab(value)} className={`rounded-2xl border p-4 text-left transition ${tab === value ? 'border-emerald-400 bg-emerald-50' : 'border-subtle bg-surface hover:border-emerald-200'}`}>
            <p className="text-2xl font-bold">{count}</p><p className={`mt-1 text-xs font-semibold ${value === 'overdue' && count ? 'text-red-600' : 'text-content-tertiary'}`}>{label}</p>
          </button>
        ))}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <p className="truncate text-xl font-bold text-emerald-800">{formatPayment(expectedPayment)}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Payment to receive</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-subtle bg-surface">
        <div className="border-b border-subtle p-3">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-subtle bg-surface-app px-3"><Search className="h-4 w-4 text-content-tertiary" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search my tasks" /></label>
        </div>
        {tasksQuery.isLoading ? (
          <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-surface-app" />)}</div>
        ) : tasksQuery.isError ? (
          <div className="p-6 text-sm text-red-600">{tasksQuery.error?.response?.data?.message || 'Tasks could not be loaded.'}</div>
        ) : filtered.length ? (
          <div className="divide-y divide-subtle">
            {filtered.map((task) => (
              <Link key={task._id} to={`/tasks/${task._id}`} className="group flex items-start gap-3 p-4 hover:bg-surface-app sm:items-center">
                <span className={`mt-1 h-3 w-3 shrink-0 rounded-full sm:mt-0 ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'review' ? 'bg-violet-500' : task.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-sm font-bold group-hover:text-emerald-800">{task.title}</h2><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${priorityStyles[task.priority]}`}>{task.priority}</span></div>
                  <p className="mt-1 truncate text-xs text-content-tertiary">{task.key} · {task.projectId?.name} · {task.status.replaceAll('_', ' ')}</p>
                  {task.paymentAmount > 0 && <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:hidden">{formatPayment(task.paymentAmount)}</span>}
                </div>
                <div className="hidden items-center gap-4 text-xs text-content-secondary sm:flex">
                  {task.paymentAmount > 0 && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">{formatPayment(task.paymentAmount)}</span>}
                  {task.subtaskCount > 0 && <span className="flex items-center gap-1"><CheckSquare2 className="h-3.5 w-3.5" />{task.completedSubtaskCount}/{task.subtaskCount}</span>}
                  <span className={`flex min-w-24 items-center gap-1.5 ${isOverdue(task) ? 'font-bold text-red-600' : ''}`}><CalendarDays className="h-3.5 w-3.5" />{isOverdue(task) ? 'Overdue' : formatDate(task.dueDate, 'No deadline')}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h2 className="mt-4 font-bold">Nothing here</h2><p className="mt-2 text-sm text-content-secondary">No assigned tasks match this view.</p></div>
        )}
      </div>
      {showCreate && <TaskCreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); queryClient.invalidateQueries({ queryKey: ['tasks'] }); }} />}
    </>
  );
}

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [paymentInput, setPaymentInput] = useState('');
  const taskQuery = useQuery({ queryKey: ['task', taskId], queryFn: () => fetchTask(taskId) });
  const task = taskQuery.data;
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['task-board'] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };
  const updateMutation = useMutation({ mutationFn: (payload) => updateTask(taskId, payload), onSuccess: refresh });
  const createSubtaskMutation = useMutation({
    mutationFn: (title) => createSubTask(taskId, { title }),
    onSuccess: () => { setSubtaskTitle(''); refresh(); },
  });
  const toggleSubtaskMutation = useMutation({
    mutationFn: ({ subTaskId, completed }) => updateSubTask(taskId, subTaskId, { completed }),
    onSuccess: refresh,
  });
  const deleteSubtaskMutation = useMutation({
    mutationFn: (subTaskId) => deleteSubTask(taskId, subTaskId),
    onSuccess: refresh,
  });
  const checklistProgress = task?.subtaskCount
    ? Math.round((task.completedSubtaskCount / task.subtaskCount) * 100)
    : 0;
  useEffect(() => {
    if (task?.paymentAmount !== undefined) setPaymentInput(String(task.paymentAmount || ''));
  }, [task?.paymentAmount]);

  if (taskQuery.isLoading) return <div className="h-96 animate-pulse rounded-2xl border border-subtle bg-surface" />;
  if (taskQuery.isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{taskQuery.error?.response?.data?.message || 'Task could not be loaded.'}</div>;

  return (
    <>
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-content-secondary hover:text-content-primary"><ArrowLeft className="h-4 w-4" /> Back</button>
      <section className="rounded-2xl border border-subtle bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-surface-app px-2 py-1 text-[10px] font-bold text-content-tertiary">{task.key}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${priorityStyles[task.priority]}`}>{task.priority}</span>{task.type !== 'task' && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold uppercase text-violet-700">{task.type}</span>}</div>
            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{task.title}</h1>
            <p className="mt-2 text-sm text-content-secondary">{task.workspaceId?.name} / <Link to={`/projects/${task.projectId?._id}`} className="font-semibold text-emerald-700">{task.projectId?.name}</Link></p>
          </div>
          {task.access.canEdit && <select value={task.status} onChange={(event) => updateMutation.mutate({ status: event.target.value })} disabled={updateMutation.isPending} className="h-11 rounded-xl border border-subtle bg-surface px-3 text-sm font-bold">{statuses.filter(([value]) => value !== 'approved' || task.status === 'approved').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-subtle bg-surface p-5 sm:p-6">
            <h2 className="font-bold">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-content-secondary">{task.description || 'No description provided.'}</p>
          </section>

          {task.type === 'bug' && (
            <section className="rounded-2xl border border-red-100 bg-red-50/40 p-5 sm:p-6">
              <div className="flex items-center gap-2 text-red-700"><Bug className="h-5 w-5" /><h2 className="font-bold">Bug report</h2></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {[
                  ['Steps to reproduce', task.issueDetails?.stepsToReproduce],
                  ['Expected result', task.issueDetails?.expectedResult],
                  ['Actual result', task.issueDetails?.actualResult],
                  ['Environment', task.issueDetails?.environment],
                ].map(([label, value]) => <div key={label}><p className="text-xs font-bold uppercase tracking-wide text-red-700">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-content-secondary">{value || 'Not provided'}</p></div>)}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-subtle bg-surface">
            <div className="border-b border-subtle p-5">
              <div className="flex items-center justify-between"><div><h2 className="font-bold">Checklist & subtasks</h2><p className="mt-1 text-xs text-content-tertiary">{task.completedSubtaskCount} of {task.subtaskCount} completed</p></div><b className="text-sm text-emerald-700">{checklistProgress}%</b></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-app"><span className="block h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${checklistProgress}%` }} /></div>
            </div>
            <div className="divide-y divide-subtle">
              {task.subtasks.map((subtask) => (
                <div key={subtask._id} className="flex items-center gap-3 p-4">
                  <button disabled={!task.access.canEdit || toggleSubtaskMutation.isPending} onClick={() => toggleSubtaskMutation.mutate({ subTaskId: subtask._id, completed: !subtask.completed })} className={subtask.completed ? 'text-emerald-600' : 'text-content-tertiary'}>{subtask.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button>
                  <div className="min-w-0 flex-1"><p className={`text-sm font-medium ${subtask.completed ? 'text-content-tertiary line-through' : ''}`}>{subtask.title}</p>{subtask.assigneeId && <p className="mt-1 text-xs text-content-tertiary">{subtask.assigneeId.name}</p>}</div>
                  {task.access.canEdit && <button onClick={() => deleteSubtaskMutation.mutate(subtask._id)} className="rounded-lg p-1.5 text-content-tertiary hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
              {!task.subtasks.length && <div className="p-6 text-center text-sm text-content-tertiary">No subtasks yet.</div>}
            </div>
            {task.access.canEdit && (
              <form onSubmit={(event) => { event.preventDefault(); if (subtaskTitle.trim()) createSubtaskMutation.mutate(subtaskTitle.trim()); }} className="flex gap-2 border-t border-subtle p-4">
                <input value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} maxLength={300} className="h-10 min-w-0 flex-1 rounded-xl border border-subtle bg-surface-app px-3 text-sm outline-none focus:border-emerald-600" placeholder="Add a checklist item" />
                <button disabled={!subtaskTitle.trim() || createSubtaskMutation.isPending} className="rounded-xl bg-emerald-800 px-3 text-sm font-bold text-white disabled:opacity-50"><Plus className="h-4 w-4" /></button>
              </form>
            )}
          </section>

          <TaskCollaborationPanels task={task} refreshTask={refresh} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-subtle bg-surface">
            <div className="border-b border-subtle px-5 py-4"><h2 className="font-bold">Task details</h2></div>
            <div className="space-y-5 p-5">
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Assignees</p><div className="mt-2 flex flex-wrap gap-2">{task.assigneeIds.length ? task.assigneeIds.map((user) => <span key={user._id} className="flex items-center gap-2 rounded-full border border-subtle py-1 pl-1 pr-2.5 text-xs font-semibold"><Avatar user={user} />{user.name}</span>) : <span className="flex items-center gap-2 text-sm text-content-secondary"><UserRound className="h-4 w-4" /> Unassigned</span>}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Start</p><p className="mt-1.5 text-sm font-semibold">{formatDate(task.startDate)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Due</p><p className={`mt-1.5 text-sm font-semibold ${isOverdue(task) ? 'text-red-600' : ''}`}>{formatDate(task.dueDate)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Estimate</p><p className="mt-1.5 text-sm font-semibold">{task.estimatedHours || 0}h</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Actual</p><p className="mt-1.5 text-sm font-semibold">{task.actualHours || 0}h</p></div>
              </div>
              {task.paymentAmount !== undefined && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Task payment</p>
                  {task.access.canManage ? (
                    <form onSubmit={(event) => { event.preventDefault(); updateMutation.mutate({ paymentAmount: Number(paymentInput || 0) }); }} className="mt-2 flex gap-2">
                      <span className="flex h-10 items-center rounded-lg border border-emerald-200 bg-white px-3 font-bold text-emerald-800">₹</span>
                      <input type="number" min="0" max="100000000" step="1" value={paymentInput} onChange={(event) => setPaymentInput(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-bold outline-none" />
                      <button disabled={updateMutation.isPending} className="rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white">Save</button>
                    </form>
                  ) : (
                    <p className="mt-1 text-xl font-bold text-emerald-800">{formatPayment(task.paymentAmount)}</p>
                  )}
                </div>
              )}
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Created by</p><p className="mt-1.5 text-sm font-semibold">{task.createdBy?.name || 'Unknown'}</p></div>
              {task.tags?.length > 0 && <div><p className="text-[10px] font-bold uppercase tracking-wide text-content-tertiary">Tags</p><div className="mt-2 flex flex-wrap gap-1.5">{task.tags.map((tag) => <span key={tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">#{tag}</span>)}</div></div>}
            </div>
          </section>
          <section className="rounded-2xl border border-subtle bg-surface p-5"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-700" /><h2 className="text-sm font-bold">Activity</h2></div><p className="mt-3 text-xs leading-5 text-content-tertiary">Creation, status changes, assignments, and checklist updates are recorded in the secure audit log.</p></section>
        </aside>
      </div>
    </>
  );
}

export default function TasksPage() {
  const { taskId } = useParams();
  return taskId ? <TaskDetail /> : <MyWorkList />;
}
