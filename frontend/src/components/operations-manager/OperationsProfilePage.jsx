import { useEffect, useState } from 'react';
import { Mail, Building2, Shield, Phone } from 'lucide-react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import Avatar from '../ui/Avatar';

export default function OperationsProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/operations-manager/profile').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { user, stats, activity } = data || {};

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Profile" description="Operations manager profile and activity" breadcrumbs={['Operations', 'Profile']} />

      <div className="rounded-2xl border border-subtle bg-surface/80 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-teal-600/20 via-emerald-500/15 to-cyan-500/20" />
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar name={user?.name} size="lg" className="!w-24 !h-24 ring-4 ring-surface shadow-xl" />
          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-bold text-content-primary">{user?.name}</h2>
            <p className="text-sm text-content-secondary">{user?.roleName} · {user?.department}</p>
          </div>
        </div>
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Phone, label: 'Phone', value: user?.phone },
            { icon: Building2, label: 'Department', value: user?.department },
            { icon: Shield, label: 'Role', value: user?.roleName },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-elevated/50 border border-subtle">
              <div className="p-2 rounded-lg bg-teal-500/10"><Icon className="w-4 h-4 text-teal-600" /></div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{label}</p>
                <p className="text-sm font-medium text-content-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bookings Managed', value: stats?.bookingsManaged },
          { label: 'Vouchers Issued', value: stats?.vouchersIssued },
          { label: 'Tickets Resolved', value: stats?.ticketsResolved },
          { label: 'Fulfillment Rate', value: `${stats?.fulfillmentRate}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-subtle bg-surface/80 p-4 text-center">
            <p className="text-2xl font-black text-teal-600">{s.value}</p>
            <p className="text-xs text-content-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activity?.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
              <p className="text-sm text-content-primary">{a.action}</p>
              <p className="text-xs text-content-muted">{new Date(a.date).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
