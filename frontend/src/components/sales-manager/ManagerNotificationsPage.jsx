import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, UserPlus, AlertTriangle, FileText, Trophy, Search } from 'lucide-react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const ICONS = {
  new_lead: UserPlus,
  missed_followup: AlertTriangle,
  quote_approval: FileText,
  converted: Trophy,
};

const COLORS = {
  new_lead: 'bg-sky-500/10 text-sky-600 ring-sky-500/20',
  missed_followup: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
  quote_approval: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  converted: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
};

export default function ManagerNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });

  useEffect(() => {
    API.get('/sales-manager/notifications', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    }).then((r) => {
      setNotifications(r.data?.data || []);
      setPagination((p) => ({ ...p, ...(r.data?.pagination || {}) }));
    });
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Alerts for leads, follow-ups, and approvals" breadcrumbs={['Sales Manager', 'Notifications']} />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-surface/80 text-sm outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl divide-y divide-subtle">
        {notifications.map((n, i) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-4 p-5 ${!n.read ? 'bg-violet-500/[0.03]' : ''}`}
            >
              <div className={`p-2.5 rounded-xl ring-1 ring-inset shrink-0 ${COLORS[n.type]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-content-primary">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-violet-500" />}
                </div>
                <p className="text-sm text-content-secondary mt-0.5">{n.message}</p>
                <p className="text-xs text-content-muted mt-1">{n.time}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-content-muted">
          Page {pagination.page} of {Math.max(pagination.totalPages || 1, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= (pagination.totalPages || 1)}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
