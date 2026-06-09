import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { authStorage } from '../auth/authStorage';
import { toast } from './ToastContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notificationApi';
import NotificationDrawer from '../components/notifications/NotificationDrawer';
const NotificationContext = createContext(null);

function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function showBrowserNotification(notification) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new window.Notification(notification.title, {
      body: notification.message,
      tag: notification._id,
      icon: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const handleIncoming = useCallback((notification) => {
    if (!notification?._id) return;

    setNotifications((prev) => {
      if (prev.some((n) => n._id === notification._id)) return prev;
      return [notification, ...prev].slice(0, 100);
    });

    if (!notification.isRead && !notification.read) {
      setUnreadCount((c) => {
        const next = c + 1;
        window.dispatchEvent(new CustomEvent('notifications:unread', { detail: next }));
        return next;
      });
    }

    toast.info(`${notification.title}\n${notification.message}`, 6000);
    showBrowserNotification(notification);
  }, []);

  const loadInitial = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        fetchNotifications(50),
        fetchUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      /* offline / unauthorized */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      return;
    }

    loadInitial();

    const token = authStorage.getToken();
    if (!token) return;

    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('notification:new', handleIncoming);
    socket.on('notification:unread', ({ count }) => {
      if (typeof count === 'number') {
        setUnreadCount(count);
        window.dispatchEvent(new CustomEvent('notifications:unread', { detail: count }));
      }
    });
    socket.on('notification:history', (history) => {
      if (Array.isArray(history) && history.length) {
        setNotifications(history);
      }
    });

    return () => {
      socket.off('notification:new', handleIncoming);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user, loadInitial, handleIncoming]);

  const requestBrowserPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    requestBrowserPermission();
  }, [requestBrowserPermission]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* silent — avoid toast spam on click */
    }
  }, []);

  const handleNotificationClick = useCallback(async (item) => {
    if (!item?._id) return;
    const unread = !item.read && !item.isRead;
    if (unread) await markRead(item._id);
    const href = item.meta?.href;
    if (href) {
      setDrawerOpen(false);
      navigate(href);
    }
  }, [markRead, navigate]);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* silent */
    }
  }, []);

  const refresh = useCallback(() => loadInitial(), [loadInitial]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        drawerOpen,
        connected,
        loading,
        openDrawer,
        closeDrawer,
        markRead,
        handleNotificationClick,
        markAllRead,
        refresh,
        requestBrowserPermission,
      }}
    >
      {children}
      <NotificationDrawer />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
