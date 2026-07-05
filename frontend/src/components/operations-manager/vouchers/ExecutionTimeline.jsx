import { cn } from '../../../lib/utils';

const EVENT_ICONS = {
  booking_confirmed: '✓',
  hotel_assigned: '🏨',
  cab_assigned: '🚗',
  activity_assigned: '🎯',
  voucher_generated: '📄',
  voucher_regenerated: '🔄',
  voucher_sent: '📤',
  vendor_confirmed: '✅',
  vendor_rejected: '❌',
  vendor_changes_requested: '✏️',
  email_sent: '✉️',
  whatsapp_sent: '💬',
  travel_kit_generated: '📘',
  trip_started: '🛫',
  trip_completed: '🏁',
};

export default function ExecutionTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="rounded-3xl border border-subtle bg-surface/80 p-6 text-center text-sm text-content-muted">
        No execution events yet. Actions will appear here as you manage this trip.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-subtle bg-surface/80 p-6 shadow-sm">
      <h3 className="font-bold text-lg mb-5">Execution Timeline</h3>
      <div className="space-y-0">
        {events.map((ev, i) => (
          <div key={ev._id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0',
                'bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20',
              )}
              >
                {EVENT_ICONS[ev.type] || '•'}
              </div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-indigo-200/60 dark:bg-indigo-800/40 my-1 min-h-[24px]" />}
            </div>
            <div className="pb-6 flex-1 min-w-0">
              <p className="font-semibold text-sm text-content-primary">{ev.title}</p>
              {ev.description && <p className="text-xs text-content-muted mt-0.5">{ev.description}</p>}
              <p className="text-[11px] text-content-muted mt-1.5">
                {ev.actorName || 'System'}
                {' · '}
                {ev.createdAt
                  ? new Date(ev.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                  : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
