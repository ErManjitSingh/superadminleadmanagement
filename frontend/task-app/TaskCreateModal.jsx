import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bug, CheckSquare2, X } from 'lucide-react';
import { createTask, fetchProject, fetchProjects } from './api/workApi';

const statuses = [
  ['backlog', 'Backlog'],
  ['todo', 'To do'],
  ['in_progress', 'In progress'],
  ['review', 'Review'],
  ['completed', 'Completed'],
];
const types = [
  ['task', 'Task'],
  ['bug', 'Bug'],
  ['feature', 'Feature'],
  ['improvement', 'Improvement'],
  ['support', 'Support'],
  ['research', 'Research'],
];

export default function TaskCreateModal({ initialProjectId = '', initialStatus = 'backlog', onClose, onCreated }) {
  const [form, setForm] = useState({
    projectId: initialProjectId,
    title: '',
    description: '',
    type: 'task',
    assigneeIds: [],
    priority: 'medium',
    status: initialStatus,
    startDate: '',
    dueDate: '',
    estimatedHours: '',
    paymentAmount: '',
    tags: '',
    issueDetails: {
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      environment: '',
    },
  });
  const projectsQuery = useQuery({
    queryKey: ['projects', 'task-picker'],
    queryFn: () => fetchProjects({ limit: 100 }),
  });
  const projectQuery = useQuery({
    queryKey: ['project', form.projectId],
    queryFn: () => fetchProject(form.projectId),
    enabled: Boolean(form.projectId),
  });
  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: onCreated,
  });
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleAssignee = (userId) => set(
    'assigneeIds',
    form.assigneeIds.includes(userId)
      ? form.assigneeIds.filter((id) => id !== userId)
      : [...form.assigneeIds, userId],
  );
  const members = projectQuery.data?.members?.filter((member) => member.userId && member.role !== 'client_viewer') || [];

  useEffect(() => {
    setForm((current) => ({ ...current, assigneeIds: [], paymentAmount: '' }));
  }, [form.projectId]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-5">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close task form" />
      <div className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-2xl border border-subtle bg-surface sm:max-w-3xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-subtle bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckSquare2 className="h-4 w-4" /></span>
            <div><h2 className="font-bold">Create task</h2><p className="mt-0.5 text-xs text-content-tertiary">Add a clear owner, outcome, and deadline.</p></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-content-tertiary hover:bg-surface-app"><X className="h-4 w-4" /></button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({
              ...form,
              startDate: form.startDate ? new Date(`${form.startDate}T00:00:00.000Z`).toISOString() : null,
              dueDate: form.dueDate ? new Date(`${form.dueDate}T23:59:59.999Z`).toISOString() : null,
              estimatedHours: Number(form.estimatedHours || 0),
              paymentAmount: Number(form.paymentAmount || 0),
              tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
              issueDetails: form.type === 'bug' ? form.issueDetails : undefined,
            });
          }}
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Project</span>
              <select required value={form.projectId} onChange={(event) => set('projectId', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">
                <option value="">Select a project</option>
                {(projectsQuery.data?.data || []).filter((project) => !['completed', 'archived'].includes(project.status)).map((project) => <option key={project._id} value={project._id}>{project.key} — {project.name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Task title</span>
              <input autoFocus required minLength={2} maxLength={300} value={form.title} onChange={(event) => set('title', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm outline-none focus:border-emerald-600" placeholder="What needs to be delivered?" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Description</span>
              <textarea rows={4} maxLength={20000} value={form.description} onChange={(event) => set('description', event.target.value)} className="w-full resize-none rounded-xl border border-subtle bg-surface px-3 py-2.5 text-sm outline-none focus:border-emerald-600" placeholder="Context, acceptance criteria, links, or delivery notes" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Type</span>
              <select value={form.type} onChange={(event) => set('type', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Priority</span>
              <select value={form.priority} onChange={(event) => set('priority', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Status</span>
              <select value={form.status} onChange={(event) => set('status', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Estimate (hours)</span>
              <input type="number" min="0" max="100000" step="0.25" value={form.estimatedHours} onChange={(event) => set('estimatedHours', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" placeholder="0" />
            </label>
            {projectQuery.data?.access?.canManage && (
              <label>
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Task payment (₹)</span>
                <input type="number" min="0" max="100000000" step="1" value={form.paymentAmount} onChange={(event) => set('paymentAmount', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" placeholder="Amount payable to assignee" />
              </label>
            )}
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Start date</span>
              <input type="date" value={form.startDate} onChange={(event) => set('startDate', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Due date</span>
              <input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={(event) => set('dueDate', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" />
            </label>
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-content-tertiary">Tags <span className="font-normal normal-case">(comma separated)</span></span>
              <input maxLength={400} value={form.tags} onChange={(event) => set('tags', event.target.value)} className="h-11 w-full rounded-xl border border-subtle bg-surface px-3 text-sm" placeholder="development, urgent, client" />
            </label>
            {members.length > 0 && (
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-content-tertiary">Assignees</legend>
                <div className="grid max-h-40 gap-1 overflow-y-auto rounded-xl border border-subtle p-2 sm:grid-cols-2">
                  {members.map((member) => (
                    <label key={member._id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-surface-app">
                      <input type="checkbox" checked={form.assigneeIds.includes(member.userId._id)} onChange={() => toggleAssignee(member.userId._id)} className="accent-emerald-700" />
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-900">{member.userId.name.charAt(0)}</span>
                      <span className="truncate text-sm font-semibold">{member.userId.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {form.type === 'bug' && (
              <fieldset className="grid gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-4 sm:col-span-2 sm:grid-cols-2">
                <legend className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-red-700"><Bug className="h-3.5 w-3.5" /> Bug details</legend>
                {[
                  ['stepsToReproduce', 'Steps to reproduce'],
                  ['expectedResult', 'Expected result'],
                  ['actualResult', 'Actual result'],
                  ['environment', 'Environment'],
                ].map(([field, label]) => (
                  <label key={field}>
                    <span className="mb-1.5 block text-xs font-semibold text-content-secondary">{label}</span>
                    <textarea rows={field === 'environment' ? 2 : 3} value={form.issueDetails[field]} onChange={(event) => setForm((current) => ({ ...current, issueDetails: { ...current.issueDetails, [field]: event.target.value } }))} className="w-full resize-none rounded-xl border border-red-100 bg-white px-3 py-2 text-sm outline-none focus:border-red-300" />
                  </label>
                ))}
              </fieldset>
            )}
            {mutation.isError && <p className="sm:col-span-2 text-sm text-red-600">{mutation.error?.response?.data?.message || 'Task could not be created.'}</p>}
          </div>
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-subtle bg-surface px-5 py-4">
            <button type="button" onClick={onClose} className="rounded-xl border border-subtle px-4 py-2.5 text-sm font-semibold">Cancel</button>
            <button disabled={mutation.isPending || !form.projectId} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{mutation.isPending ? 'Creating…' : 'Create task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
