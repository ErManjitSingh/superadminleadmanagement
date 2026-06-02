import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';

const TYPE_COLORS = {
  followup: '#0EA5E9',
  travel: '#10B981',
  meeting: '#8B5CF6',
};

export default function ExecutiveCalendarPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get('/sales-executive/calendar').then((r) => {
      setEvents(r.data.map((e) => ({
        id: e._id,
        title: e.title,
        start: e.start,
        backgroundColor: TYPE_COLORS[e.type] || TYPE_COLORS.followup,
        borderColor: 'transparent',
        extendedProps: { type: e.type },
      })));
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Follow-ups, travel dates, and meetings" breadcrumbs={['Sales Executive', 'Calendar']} />

      <div className="flex flex-wrap gap-3 mb-2">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="inline-flex items-center gap-1.5 text-xs font-medium text-content-secondary">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-subtle bg-surface p-4 sm:p-6 followup-calendar shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          height="auto"
          eventContent={(arg) => (
            <div className="px-1 py-0.5 text-[10px] font-medium truncate text-white">
              {arg.event.title}
            </div>
          )}
        />
      </div>
    </div>
  );
}
