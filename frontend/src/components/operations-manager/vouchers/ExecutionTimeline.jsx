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
  lead_converted: '✨',
  advance_payment: '💰',
  payment_received: '💰',
};

const ROLE_BADGE = {
  sales_executive: 'bg-sky-500/15 text-sky-700',
  sales_manager: 'bg-sky-500/15 text-sky-700',
  operations_manager: 'bg-violet-500/15 text-violet-700',
  admin: 'bg-indigo-500/15 text-indigo-700',
  system: 'bg-slate-500/15 text-slate-600',
};

const VISIBLE_COUNT = 6;

function roleLabel(ev) {
  const role = ev.actorRole || ev.department || 'System';
  if (role === 'system') return 'System';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ExecutionTimeline({ events = [], compact = false }) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-subtle bg-surface p-6 text-center text-sm text-content-muted">
        No execution events yet. Actions will appear here as you manage this trip.
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className={cn('rounded-2xl border border-subtle bg-surface shadow-sm', compact ? 'p-4' : 'p-6')}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-content-primary">Execution Timeline</h3>
        {sorted.length > VISIBLE_COUNT && (
          <span className="text-[11px] text-content-muted">{sorted.length} events · scroll</span>
        )}
      </div>
      <div className={cn('space-y-0 pr-1 scrollbar-thin', sorted.length > VISIBLE_COUNT && 'max-h-[26rem] overflow-y-auto')}>
        {sorted.map((ev, i) => {
          const badgeClass = ROLE_BADGE[ev.actorRole] || ROLE_BADGE.system;
          return (
            <div key={ev._id || i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-sm">
                  {EVENT_ICONS[ev.type] || '•'}
                </div>
                {i < sorted.length - 1 && <div className="my-1 w-px min-h-[20px] flex-1 bg-subtle" />}
              </div>
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-sm text-content-primary">{ev.title}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', badgeClass)}>
                    {roleLabel(ev)}
                  </span>
                </div>
                {ev.description && <p className="text-xs text-content-muted mt-0.5">{ev.description}</p>}
                <p className="text-[11px] text-content-muted mt-1">
                  {ev.actorName || 'System'}
                  {' · '}
                  {ev.createdAt
                    ? new Date(ev.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
                    })
                    : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {sorted.length > VISIBLE_COUNT && (
        <p className="mt-2 text-center text-[11px] font-medium text-violet-600">View Full Timeline — scroll above</p>
      )}
    </div>
  );
}
