import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  CalendarDays,
  CheckSquare2,
  GripVertical,
  MessageSquare,
  Paperclip,
  Plus,
  Rows3,
  UserRound,
} from 'lucide-react';
import { fetchProjects, fetchTaskBoard, moveTask } from './api/workApi';
import TaskCreateModal from './TaskCreateModal';

const columns = [
  ['backlog', 'Backlog', 'bg-slate-500'],
  ['todo', 'To do', 'bg-blue-500'],
  ['in_progress', 'In progress', 'bg-amber-500'],
  ['review', 'Review', 'bg-violet-500'],
  ['approved', 'Approved', 'bg-teal-500'],
  ['completed', 'Completed', 'bg-emerald-600'],
];

const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-700',
  urgent: 'bg-red-50 text-red-700',
};

function dueLabel(value) {
  if (!value) return null;
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  const days = Math.round((dueDay - today) / 86400000);
  if (days < 0) return { label: 'Overdue', className: 'text-red-600' };
  if (days === 0) return { label: 'Today', className: 'text-amber-700' };
  if (days === 1) return { label: 'Tomorrow', className: 'text-blue-700' };
  return {
    label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(due),
    className: 'text-content-secondary',
  };
}

function TaskCardContent({ task, overlay = false }) {
  const due = dueLabel(task.dueDate);
  const checklist = task.subtaskCount
    ? Math.round((task.completedSubtaskCount / task.subtaskCount) * 100)
    : null;
  return (
    <div className={`rounded-xl border border-subtle bg-surface p-3.5 shadow-sm ${overlay ? 'rotate-2 shadow-xl' : 'hover:border-emerald-200 hover:shadow-md'}`}>
      <div className="flex items-start gap-2">
        {!overlay && <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-content-tertiary" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-bold text-content-tertiary">{task.key}</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${priorityStyles[task.priority]}`}>{task.priority}</span>
            {task.type !== 'task' && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-700">{task.type}</span>}
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-content-primary">{task.title}</h3>
          {task.tags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{task.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded bg-surface-app px-1.5 py-0.5 text-[9px] font-semibold text-content-tertiary">#{tag}</span>)}</div>}
          {checklist != null && <div className="mt-3 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-app"><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${checklist}%` }} /></span><span className="text-[9px] font-bold text-content-tertiary">{task.completedSubtaskCount}/{task.subtaskCount}</span></div>}
          <div className="mt-3 flex items-center gap-2 border-t border-subtle pt-2.5 text-[10px] text-content-tertiary">
            {due && <span className={`flex items-center gap-1 font-semibold ${due.className}`}><CalendarDays className="h-3 w-3" />{due.label}</span>}
            {task.commentCount > 0 && <span className="ml-auto flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task.commentCount}</span>}
            {task.attachmentCount > 0 && <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{task.attachmentCount}</span>}
            <span className={due ? '' : 'ml-auto'}>
              {task.assigneeIds?.length ? (
                <span className="flex -space-x-1.5">{task.assigneeIds.slice(0, 3).map((user) => <span key={user._id} title={user.name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-100 text-[8px] font-bold text-emerald-900">{user.name?.charAt(0)}</span>)}</span>
              ) : <UserRound className="h-4 w-4" />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraggableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.25 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      <Link to={`/tasks/${task._id}`} onClick={(event) => { if (isDragging) event.preventDefault(); }}><TaskCardContent task={task} /></Link>
    </div>
  );
}

function BoardColumn({ column, tasks, onCreate }) {
  const [status, title, tone] = column;
  const approvalOnly = status === 'approved';
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: approvalOnly });
  return (
    <section ref={setNodeRef} className={`flex w-[300px] shrink-0 flex-col rounded-2xl border p-2 transition ${isOver ? 'border-emerald-400 bg-emerald-50/70' : 'border-subtle bg-surface-app/70'}`}>
      <div className="flex items-center gap-2 px-2 py-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} />
        <h2 className="text-xs font-bold uppercase tracking-wide text-content-secondary">{title}</h2>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-content-tertiary">{tasks.length}</span>
        {!approvalOnly && <button onClick={() => onCreate(status)} className="rounded-lg p-1 text-content-tertiary hover:bg-surface hover:text-emerald-700" aria-label={`Add task to ${title}`}><Plus className="h-4 w-4" /></button>}
      </div>
      <div className="min-h-32 flex-1 space-y-2 overflow-y-auto p-1">
        {tasks.map((task) => <DraggableTask key={task._id} task={task} />)}
        {!tasks.length && (approvalOnly
          ? <div className="rounded-xl border border-dashed border-subtle px-3 py-8 text-center text-xs font-semibold text-content-tertiary">Approval Center only</div>
          : <button onClick={() => onCreate(status)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-subtle px-3 py-8 text-xs font-semibold text-content-tertiary hover:border-emerald-300 hover:text-emerald-700"><Plus className="h-4 w-4" /> Add task</button>)}
      </div>
    </section>
  );
}

export default function TaskBoardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const [createStatus, setCreateStatus] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const projectsQuery = useQuery({
    queryKey: ['projects', 'board-picker'],
    queryFn: () => fetchProjects({ limit: 100 }),
  });
  const boardQuery = useQuery({
    queryKey: ['task-board', projectId],
    queryFn: () => fetchTaskBoard(projectId),
    enabled: Boolean(projectId),
  });
  const moveMutation = useMutation({
    mutationFn: ({ taskId, status }) => moveTask(taskId, { status }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['task-board', projectId] }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
  const tasksByStatus = useMemo(() => Object.fromEntries(columns.map(([status]) => [
    status,
    (boardQuery.data?.tasks || []).filter((task) => task.status === status),
  ])), [boardQuery.data]);

  const chooseProject = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('projectId', value); else next.delete('projectId');
    setSearchParams(next);
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-emerald-700">Execution</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Kanban Board</h1><p className="mt-2 text-sm text-content-secondary">Move tasks across the workflow; every change is saved immediately.</p></div>
        <div className="flex gap-2">
          <select value={projectId} onChange={(event) => chooseProject(event.target.value)} className="h-11 min-w-56 rounded-xl border border-subtle bg-surface px-3 text-sm font-semibold"><option value="">Select project</option>{(projectsQuery.data?.data || []).map((project) => <option key={project._id} value={project._id}>{project.key} — {project.name}</option>)}</select>
          {projectId && <button onClick={() => setCreateStatus('backlog')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Task</span></button>}
        </div>
      </div>
      {!projectId ? (
        <div className="mt-6 rounded-2xl border border-dashed border-subtle bg-surface p-12 text-center"><Rows3 className="mx-auto h-10 w-10 text-emerald-700" /><h2 className="mt-4 text-lg font-bold">Choose a project</h2><p className="mt-2 text-sm text-content-secondary">The board displays real tasks for one project at a time.</p></div>
      ) : boardQuery.isLoading ? (
        <div className="mt-6 flex gap-4 overflow-hidden">{columns.slice(0, 4).map(([status]) => <div key={status} className="h-[560px] w-[300px] shrink-0 animate-pulse rounded-2xl border border-subtle bg-surface" />)}</div>
      ) : boardQuery.isError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{boardQuery.error?.response?.data?.message || 'Board could not be loaded.'}</div>
      ) : (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-subtle bg-surface px-4 py-3 text-xs text-content-secondary">
            <CheckSquare2 className="h-4 w-4 text-emerald-700" /><b className="text-content-primary">{boardQuery.data.project.name}</b><span>{boardQuery.data.tasks.length} tasks</span><span className="ml-auto font-bold">{boardQuery.data.project.progress}% complete</span>
          </div>
          <DndContext
            sensors={sensors}
            onDragStart={({ active }) => setActiveTask(active.data.current?.task || null)}
            onDragCancel={() => setActiveTask(null)}
            onDragEnd={({ active, over }) => {
              setActiveTask(null);
              if (!over) return;
              const task = active.data.current?.task;
              const status = String(over.id);
              if (!task || task.status === status || !columns.some(([value]) => value === status)) return;
              queryClient.setQueryData(['task-board', projectId], (current) => current ? {
                ...current,
                tasks: current.tasks.map((item) => item._id === task._id ? { ...item, status } : item),
              } : current);
              moveMutation.mutate({ taskId: task._id, status });
            }}
          >
            <div className="mt-4 flex min-h-[590px] gap-3 overflow-x-auto pb-4">
              {columns.map((column) => <BoardColumn key={column[0]} column={column} tasks={tasksByStatus[column[0]] || []} onCreate={setCreateStatus} />)}
            </div>
            <DragOverlay>{activeTask ? <div className="w-[288px]"><TaskCardContent task={activeTask} overlay /></div> : null}</DragOverlay>
          </DndContext>
        </>
      )}
      {createStatus && <TaskCreateModal initialProjectId={projectId} initialStatus={createStatus} onClose={() => setCreateStatus(null)} onCreated={() => { setCreateStatus(null); queryClient.invalidateQueries({ queryKey: ['task-board', projectId] }); queryClient.invalidateQueries({ queryKey: ['tasks'] }); }} />}
    </>
  );
}
