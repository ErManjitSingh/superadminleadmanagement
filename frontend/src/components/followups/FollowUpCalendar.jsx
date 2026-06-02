import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { toCalendarEvents } from './followupUtils';

export default function FollowUpCalendar({ followups, onEventClick }) {
  const calRef = useRef(null);
  const events = toCalendarEvents(followups);

  return (
    <div className="followup-calendar rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden p-4 sm:p-5">
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        events={events}
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          onEventClick?.(info.event.extendedProps.followup);
        }}
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        nowIndicator
        eventDisplay="block"
        dayMaxEvents={3}
      />
    </div>
  );
}
