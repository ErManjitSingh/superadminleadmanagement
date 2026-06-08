import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Building2, Shield, Users, Target, TrendingUp } from 'lucide-react';
import API from '../../api/axios';
import PageHeader from '../ui/PageHeader';
import Avatar from '../ui/Avatar';
import { formatCurrency } from './leaderUtils';

export default function LeaderProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/team-leader/profile').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><div className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  const { user, teamStats, personalStats, activity } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Team statistics, personal metrics, and activity" breadcrumbs={['Team Leader', 'Profile']} />

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-amber-600/20 via-indigo-500/15 to-violet-500/20" />
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
            { icon: Users, label: 'Squad Size', value: `${personalStats?.teamSize} executives` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-elevated/50 border border-subtle">
              <div className="p-2 rounded-lg bg-amber-500/10"><Icon className="w-4 h-4 text-amber-600" /></div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-content-muted">{label}</p>
                <p className="text-sm font-medium text-content-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-subtle bg-surface/80 p-5">
          <h3 className="font-bold text-content-primary mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-amber-600" /> Team Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Team Leads', value: teamStats?.teamLeads },
              { label: 'Active Follow-ups', value: teamStats?.activeFollowups },
              { label: 'Conversions', value: teamStats?.teamConversions },
              { label: 'Team Revenue', value: formatCurrency(teamStats?.teamRevenue) },
              { label: 'Conversion Rate', value: `${teamStats?.conversionRate}%` },
              { label: 'Target Achievement', value: `${teamStats?.targetAchievement}%` },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-surface-elevated/50 border border-subtle">
                <p className="text-[10px] font-semibold uppercase text-content-muted">{label}</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-subtle bg-surface/80 p-5">
          <h3 className="font-bold text-content-primary mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-600" /> Personal Statistics</h3>
          <div className="space-y-3">
            {[
              { label: 'Escalations This Month', value: personalStats?.escalationsThisMonth },
              { label: 'Coaching Sessions', value: personalStats?.coachingSessions },
              { label: 'Squad Executives', value: personalStats?.teamSize },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center p-3 rounded-xl bg-surface-elevated/50">
                <span className="text-sm text-content-secondary">{label}</span>
                <span className="font-bold text-content-primary tabular-nums">{value}</span>
              </div>
            ))}
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-2"><TrendingUp className="w-3.5 h-3.5" /> Squad performing at {teamStats?.targetAchievement}% of target</p>
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 p-5">
        <h3 className="font-bold text-content-primary mb-4">Activity Timeline</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activity?.map((a) => (
            <div key={a._id} className="flex gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <p className="text-content-primary"><span className="font-semibold">{a.user}</span> — {a.action}</p>
                <p className="text-xs text-content-muted">{a.target} · {new Date(a.date).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
