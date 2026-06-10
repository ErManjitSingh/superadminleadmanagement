import { X, ExternalLink } from 'lucide-react';
import { getNotificationMeta } from '../../lib/notificationMeta';
import FollowUpCategoryBadge from '../followups/FollowUpCategoryBadge';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import { Button } from '../ui/button';
import AppDrawer from '../ui/AppDrawer';

const CATEGORY_LABELS = {
  warm: 'Warm Lead',
  cold: 'Cold Lead',
  converted: 'Converted Lead',
  expected_conv: 'Expected Conversion',
};

export default function NotificationDetailModal({ notification, onClose, onViewLead }) {
  if (!notification) return null;

  const meta = getNotificationMeta(notification.type);
  const Icon = meta.icon;
  const { meta: data = {} } = notification;
  const category = data.category;
  const leadStatus = data.leadStatus;
  const leadName = data.leadName;

  return (
    <AppDrawer open={!!notification} onClose={onClose} title="">
      <div className="flex flex-col h-full">
        <div className="p-5 border-b border-subtle flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl shrink-0 ${meta.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary">{notification.title}</h2>
              {leadName && (
                <p className="text-sm font-medium text-brand-600 mt-0.5">{leadName}</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface-elevated">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-content-secondary leading-relaxed">{notification.message}</p>

          {(category || leadStatus) && (
            <div className="p-4 rounded-xl border border-subtle bg-surface-elevated/50 space-y-3">
              <p className="text-xs font-semibold uppercase text-content-muted">Lead status</p>
              <div className="flex flex-wrap gap-2">
                {category && <FollowUpCategoryBadge category={category} />}
                {leadStatus && <LeadStatusBadge status={leadStatus} />}
              </div>
              {category && (
                <p className="text-sm text-content-secondary">
                  {category === 'converted'
                    ? 'This lead has been marked as converted.'
                    : category === 'warm'
                      ? 'This is a warm lead — follow up actively.'
                      : category === 'cold'
                        ? 'This lead is cooling down — re-engage soon.'
                        : category === 'expected_conv'
                          ? 'Expected conversion — close the deal.'
                          : CATEGORY_LABELS[category] || category}
                </p>
              )}
              {data.executiveName && (
                <p className="text-xs text-content-muted">Executive: {data.executiveName}</p>
              )}
            </div>
          )}

          <p className="text-xs text-content-muted">{notification.time || 'Recently'}</p>
        </div>

        <div className="p-5 border-t border-subtle shrink-0 flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Close
          </Button>
          {data.href && (
            <Button className="flex-1 rounded-xl gap-2" onClick={() => onViewLead?.(notification)}>
              <ExternalLink className="w-4 h-4" />
              View Lead
            </Button>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}
