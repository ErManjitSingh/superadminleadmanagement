import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Wifi, WifiOff, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { getNotificationMeta } from '../../lib/notificationMeta';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import AppDrawer from '../ui/AppDrawer';

function NotificationItem({ item, onClick }) {
  const meta = getNotificationMeta(item.type);
  const Icon = meta.icon;
  const unread = !item.read && !item.isRead;

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        'w-full text-left p-4 flex gap-3 border-b border-subtle transition-colors hover:bg-surface-elevated/50',
        unread && 'bg-brand-500/[0.04]'
      )}
    >
      <div className={cn('p-2.5 rounded-xl shrink-0 h-fit', meta.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p className="font-semibold text-content-primary text-sm leading-snug">{item.title}</p>
          {unread && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />}
        </div>
        <p className="text-sm text-content-secondary mt-0.5 line-clamp-2">{item.message}</p>
        <p className="text-xs text-content-muted mt-1">{item.time || 'just now'}</p>
      </div>
    </button>
  );
}

export default function NotificationDrawer() {
  const {
    drawerOpen,
    closeDrawer,
    notifications,
    unreadCount,
    connected,
    loading,
    markRead,
    handleNotificationClick,
    markAllRead,
    refresh,
  } = useNotifications();

  return (
    <AppDrawer open={drawerOpen} onClose={closeDrawer} title="">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10">
              <Bell className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-content-primary">Notifications</h2>
              <p className="text-xs text-content-muted flex items-center gap-1.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                {connected ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-600">
                    <Wifi className="w-3 h-3" /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-content-muted">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-surface-elevated text-content-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-subtle shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg text-xs gap-1.5"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </Button>
          <Button variant="ghost" size="sm" className="rounded-lg text-xs" onClick={refresh}>
            Refresh
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-12 text-center text-content-muted text-sm">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-content-muted flex flex-col items-center gap-2">
              <Bell className="w-10 h-10 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <NotificationItem item={item} onClick={handleNotificationClick} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </AppDrawer>
  );
}
