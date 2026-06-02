import { useEffect, useState } from 'react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import { cn } from '../../lib/utils';

const TYPE_STYLE = {
  departure: 'border-l-teal-500 bg-teal-500/5',
  return: 'border-l-violet-500 bg-violet-500/5',
};

export default function OperationsCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/calendar').then((r) => setEvents(r.data)).finally(() => setLoading(false));
  }, []);

  const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Operations Calendar" description="Departures, returns and trip milestones" breadcrumbs={['Operations', 'Calendar']} />

      <div className="rounded-2xl border border-subtle bg-surface/80 divide-y divide-subtle">
        {loading ? (
          <div className="p-16 text-center text-content-muted animate-pulse">Loading calendar...</div>
        ) : sorted.map((e) => (
          <div key={e._id} className={cn('flex items-center gap-4 px-5 py-4 border-l-4', TYPE_STYLE[e.type] || 'border-l-slate-400')}>
            <div className="text-center shrink-0 w-14">
              <p className="text-xs font-semibold uppercase text-content-muted">{new Date(e.start).toLocaleDateString('en-IN', { month: 'short' })}</p>
              <p className="text-2xl font-black text-content-primary">{new Date(e.start).getDate()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-content-primary">{e.title}</p>
              <p className="text-xs text-content-muted">{e.bookingNumber} · {e.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
