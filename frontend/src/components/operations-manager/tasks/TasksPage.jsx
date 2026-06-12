import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, Loader2 } from 'lucide-react';
import API from '../../../api/axios';
import PageHeader from '../../ui/PageHeader';
import { Button } from '../../ui/button';
import { formatDate } from '../operationsUtils';
import { cn } from '../../../lib/utils';

const STATUS_FILTERS = ['', 'pending', 'in_progress', 'completed'];

const STATUS_STYLE = {
  pending: 'bg-amber-500/15 text-amber-700',
  in_progress: 'bg-sky-500/15 text-sky-700',
  completed: 'bg-emerald-500/15 text-emerald-700',
  cancelled: 'bg-slate-500/15 text-slate-600',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    API.get('/operations-manager/tasks', { params: { status: filter || undefined } })
      .then((r) => setTasks(r.data || []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    await API.patch(`/operations-manager/tasks/${id}`, { status });
    fetchTasks();
    setUpdating(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Operations Tasks"
        description="Hotel confirmation, cab assignment, vouchers & payment verification"
        breadcrumbs={['Operations', 'Tasks']}
      />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border capitalize',
              filter === s ? 'bg-teal-600 text-white border-teal-600' : 'border-subtle text-content-muted',
            )}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-content-muted animate-pulse">Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center text-content-muted">No tasks found</div>
        ) : (
          tasks.map((t) => (
            <div key={t._id} className="rounded-2xl border border-subtle bg-surface/80 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="p-2.5 rounded-xl bg-teal-500/10 shrink-0">
                <ListTodo className="w-5 h-5 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-content-primary">{t.title}</p>
                <p className="text-xs text-content-muted capitalize mt-0.5">{t.type?.replace(/_/g, ' ')} · Due {formatDate(t.dueDate)}</p>
                {t.booking && (
                  <Link to={`/operations-manager/booking/${t.booking}`} className="text-xs text-teal-600 hover:underline mt-1 inline-block">
                    View booking
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-md capitalize', STATUS_STYLE[t.status])}>
                  {t.status?.replace(/_/g, ' ')}
                </span>
                {t.status === 'pending' && (
                  <Button variant="outline" size="sm" className="h-8 rounded-lg" disabled={updating === t._id} onClick={() => updateStatus(t._id, 'in_progress')}>
                    {updating === t._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Start'}
                  </Button>
                )}
                {t.status === 'in_progress' && (
                  <Button variant="teal" size="sm" className="h-8 rounded-lg" disabled={updating === t._id} onClick={() => updateStatus(t._id, 'completed')}>
                    Complete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
