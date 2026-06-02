import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Building2, Shield, Trophy, TrendingUp, Target, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import Avatar from '../ui/Avatar';
import { formatCurrency } from './executiveUtils';

export default function ExecutiveProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/sales-executive/profile')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const { user, metrics, activity } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Personal details and performance metrics" breadcrumbs={['Sales Executive', 'Profile']} />

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-sky-600/20 via-emerald-500/15 to-cyan-500/20" />
        <div className="px-6 pb-6 -mt-14 flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar name={user?.name} size="lg" className="!w-24 !h-24 ring-4 ring-surface shadow-xl" />
          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-bold text-content-primary">{user?.name}</h2>
            <p className="text-sm text-content-secondary">{user?.roleName} · {user?.department}</p>
          </div>
        </div>
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Building2, label: 'Department', value: user?.department },
            { icon: Shield, label: 'Role', value: user?.roleName },
            { icon: Trophy, label: 'Access Level', value: 'Lead Conversion & Quotations' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-elevated/50 border border-subtle">
              <div className="p-2 rounded-lg bg-sky-500/10"><Icon className="w-4 h-4 text-sky-600" /></div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{label}</p>
                <p className="text-sm font-medium text-content-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Target, label: 'Monthly Target', value: formatCurrency(metrics?.monthlyTarget), gradient: 'from-sky-500 to-cyan-600' },
          { icon: IndianRupee, label: 'Revenue Generated', value: formatCurrency(metrics?.revenueAchieved), gradient: 'from-emerald-500 to-teal-600' },
          { icon: Trophy, label: 'Leads Converted', value: metrics?.leadsConverted, gradient: 'from-violet-500 to-purple-600' },
          { icon: TrendingUp, label: 'Conversion Rate', value: `${metrics?.conversionRate}%`, gradient: 'from-amber-500 to-orange-600' },
        ].map(({ icon: Icon, label, value, gradient }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border border-subtle bg-surface/80 p-4"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.06]`} />
            <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${gradient} text-white mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-content-muted">{label}</p>
            <p className="text-lg font-bold text-content-primary tabular-nums">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
          <h3 className="font-bold text-content-primary mb-4">Weekly Revenue</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.weeklyRevenue || []}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                  {(metrics?.weeklyRevenue || []).map((_, i) => (
                    <Cell key={i} fill="#0EA5E9" fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
          <h3 className="font-bold text-content-primary mb-4">Activity Timeline</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {activity?.map((a) => (
              <div key={a._id} className="flex gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2 shrink-0" />
                <div>
                  <p className="text-content-primary"><span className="font-semibold">{a.user}</span> — {a.action}</p>
                  <p className="text-xs text-content-muted">{a.target} · {new Date(a.date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
