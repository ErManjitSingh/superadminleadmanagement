import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';

/** Full-page notification history — bell drawer is the primary inbox */
export default function Notifications() {
  const { openDrawer, unreadCount, notifications, markAllRead } = useNotifications();

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Notifications"
        description="Real-time alerts for leads, follow-ups, quotations, and payments"
        breadcrumbs={['Notifications']}
      />
      <div className="rounded-2xl border border-subtle bg-surface p-8 text-center max-w-lg mx-auto">
        <Bell className="w-12 h-12 mx-auto text-brand-500/60 mb-4" />
        <p className="text-content-primary font-semibold mb-1">
          {unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'You are all caught up'}
        </p>
        <p className="text-sm text-content-muted mb-6">
          {notifications.length} recent item(s) in your inbox. Open the notification center for full history.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={openDrawer} className="rounded-xl">Open notification center</Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead} className="rounded-xl">
              Mark all read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
