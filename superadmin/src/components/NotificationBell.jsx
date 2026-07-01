import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { superAdminApi } from '../api/superadmin';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { formatDate } from '../lib/utils';
import { cn } from '../lib/utils';

export default function NotificationBell({ variant = 'sidebar' }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isHeader = variant === 'header';

  const { data } = useQuery({
    queryKey: ['platform-notifications'],
    queryFn: () => superAdminApi.getNotifications({ limit: 8 }).then((r) => r.data),
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: (body) => superAdminApi.markNotificationsRead(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-notifications'] }),
  });

  const unreadCount = data?.unreadCount || 0;
  const items = data?.data || [];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative rounded-xl', isHeader ? 'text-slate-500' : 'text-slate-300')}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </Button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="Close" />
          <Card className="absolute right-0 top-12 z-50 w-80 p-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--border)] p-4">
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ all: true })}>
                  <Check className="h-3.5 w-3.5" /> Mark all read
                </Button>
              )}
            </CardHeader>
            <div className="max-h-80 overflow-auto p-2">
              {items.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">No notifications</p>
              ) : (
                items.map((n) => (
                  <div
                    key={n._id}
                    className={`mb-1 rounded-xl px-3 py-2.5 text-sm ${n.read ? 'opacity-70' : 'bg-brand-500/5'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{n.title}</p>
                      <Badge
                        className={
                          n.severity === 'critical'
                            ? 'bg-red-500/15 text-red-700'
                            : n.severity === 'warning'
                              ? 'bg-amber-500/15 text-amber-700'
                              : 'bg-slate-500/15 text-slate-600'
                        }
                      >
                        {n.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[var(--text-secondary)]">{n.message}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDate(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
