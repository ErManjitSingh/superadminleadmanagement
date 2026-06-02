import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, ArrowUpCircle, UserPlus, FileCheck, Search } from 'lucide-react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

const TYPE_META = {
  missed_followup: { icon: AlertTriangle, color: 'text-rose-600 bg-rose-500/10' },
  escalated: { icon: ArrowUpCircle, color: 'text-amber-600 bg-amber-500/10' },
  new_lead: { icon: UserPlus, color: 'text-sky-600 bg-sky-500/10' },
  quote_approved: { icon: FileCheck, color: 'text-emerald-600 bg-emerald-500/10' },
};

export default function LeaderNotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  useEffect(() => {
    setLoading(true);
    API.get('/team-leader/notifications', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      },
    })
      .then((r) => {
        setItems(r.data?.data || []);
        setPagination((p) => ({ ...p, ...(r.data?.pagination || {}) }));
      })
      .finally(() => setLoading(false));
  }, [pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Missed follow-ups, escalations, and team alerts" breadcrumbs={['Team Leader', 'Notifications']} />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-surface/80 backdrop-blur-xl text-sm focus:ring-2 focus:ring-amber-500/30 outline-none"
        />
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl divide-y divide-subtle">
        {loading ? (
          <div className="p-12 text-center text-content-muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-content-muted flex flex-col items-center gap-2"><Bell className="w-8 h-8 opacity-40" /> No notifications</div>
        ) : items.map((n, i) => {
          const meta = TYPE_META[n.type] || { icon: Bell, color: 'text-content-muted bg-surface-elevated' };
          const Icon = meta.icon;
          return (
            <motion.div key={n._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={cn('p-5 flex gap-4', !n.read && 'bg-amber-500/[0.03]')}>
              <div className={cn('p-2.5 rounded-xl shrink-0 h-fit', meta.color)}><Icon className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-content-primary">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500" />}
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
