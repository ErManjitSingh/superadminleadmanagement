import { CalendarClock, Clock, History } from 'lucide-react';
import { formatFullDateTime } from './whatsappUtils';

function Row({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-emerald-500/15 text-emerald-500' : 'bg-wa-input text-wa-text-muted'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-wa-text-muted font-medium">{label}</p>
        <p className={`text-xs mt-0.5 ${highlight ? 'text-emerald-500 font-medium' : 'text-wa-text-primary'}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

export default function WhatsAppFollowUpPanel({ lead, followups }) {
  const last = followups.find((f) => f.status === 'completed') || followups[0];
  const next = followups.find((f) => f.status === 'pending');

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-wa-text-muted flex items-center gap-1.5">
        <CalendarClock className="w-3.5 h-3.5" />
        Follow-ups
      </h4>

      <div className="space-y-3 p-3 rounded-xl bg-wa-input/50 border border-wa-border/50">
        <Row
          icon={History}
          label="Last Follow Up"
          value={lead?.lastFollowUp ? formatFullDateTime(lead.lastFollowUp) : last ? formatFullDateTime(last.scheduledAt) : null}
        />
        <Row
          icon={Clock}
          label="Next Follow Up"
          value={lead?.nextFollowUp ? formatFullDateTime(lead.nextFollowUp) : next ? formatFullDateTime(next.scheduledAt) : null}
          highlight
        />
      </div>

      {followups.length > 0 && (
        <div className="space-y-2 max-h-32 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-wa-text-muted font-medium">History</p>
          {followups.slice(0, 5).map((f) => (
            <div key={f._id} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${f.status === 'completed' ? 'bg-emerald-500' : f.status === 'missed' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="text-wa-text-secondary truncate flex-1">{f.notes || f.type}</span>
              <span className="text-[10px] text-wa-text-muted shrink-0">{formatFullDateTime(f.scheduledAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
