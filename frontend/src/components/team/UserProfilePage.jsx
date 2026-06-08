import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Building2, Shield, TrendingUp, IndianRupee, PhoneCall, Target, Activity } from 'lucide-react';
import API from '../../api/axios';
import Avatar from '../ui/Avatar';
import UserStatusBadge from './UserStatusBadge';
import { Button } from '../ui/button';
import { formatCurrency, formatLastLogin } from './constants';

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(() => {
    setLoading(true);
    API.get(`/users/${id}/profile`)
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-content-muted">User not found</p>
        <Button className="mt-4" onClick={() => navigate('/team')}>Back to Team</Button>
      </div>
    );
  }

  const stats = [
    { label: 'Assigned Leads', value: profile.stats.assignedLeads, icon: Target, gradient: 'from-sky-500 to-blue-600' },
    { label: 'Follow-ups Done', value: profile.stats.followUpsDone, icon: PhoneCall, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Revenue Generated', value: formatCurrency(profile.stats.revenueGenerated), icon: IndianRupee, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Conversion Rate', value: `${profile.stats.conversionRate}%`, icon: TrendingUp, gradient: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/team')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden"
      >
        <div className="h-28 bg-gradient-to-r from-brand-600/20 via-violet-600/20 to-sky-600/20" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar name={profile.name} size="lg" className="!w-24 !h-24 !text-3xl ring-4 ring-surface shadow-xl" />
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-content-primary">{profile.name}</h1>
                <UserStatusBadge status={profile.status} />
              </div>
              <p className="text-sm text-content-secondary mt-1">{profile.roleName} · {profile.department}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/team')}>Manage User</Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, gradient }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative overflow-hidden rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.06]`} />
            <div className="relative">
              <Icon className="w-5 h-5 text-content-muted mb-2" />
              <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{label}</p>
              <p className="text-xl font-bold text-content-primary mt-1 tabular-nums">{value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5 space-y-4"
        >
          <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider">Personal Details</h2>
          {[
            { icon: Mail, label: 'Email', value: profile.email },
            { icon: Phone, label: 'Phone', value: profile.phone || '—' },
            { icon: Building2, label: 'Department', value: profile.department },
            { icon: Shield, label: 'Role', value: profile.roleName },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-500/10"><Icon className="w-4 h-4 text-brand-600" /></div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-content-muted">{label}</p>
                <p className="text-sm font-medium text-content-primary">{value}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-subtle">
            <p className="text-[11px] font-medium uppercase tracking-wider text-content-muted">Last Login</p>
            <p className="text-sm text-content-secondary mt-0.5">{formatLastLogin(profile.lastLogin)}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="lg:col-span-1 rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
        >
          <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider mb-4">Assigned Leads</h2>
          <div className="space-y-2">
            {profile.recentLeads?.length ? profile.recentLeads.map((lead) => (
              <button
                key={lead._id}
                type="button"
                onClick={() => navigate(`/leads/${lead._id}`)}
                className="w-full text-left p-3 rounded-xl bg-surface-elevated/50 border border-subtle hover:border-brand-500/30 transition-colors"
              >
                <p className="text-sm font-semibold text-content-primary">{lead.name}</p>
                <p className="text-xs text-content-muted mt-0.5">{lead.destination} · {lead.status}</p>
              </button>
            )) : (
              <p className="text-sm text-content-muted">No leads assigned</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="lg:col-span-1 rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl p-5"
        >
          <h2 className="text-sm font-bold text-content-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Activity Timeline
          </h2>
          <div className="space-y-4">
            {profile.activity?.length ? profile.activity.map((item, i) => (
              <div key={item._id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-2" />
                  {i < profile.activity.length - 1 && <div className="w-px flex-1 bg-subtle min-h-[24px] mt-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-sm text-content-primary"><span className="font-medium">{item.action}</span>{item.target !== '—' && <> — <span className="text-brand-600">{item.target}</span></>}</p>
                  <p className="text-xs text-content-muted mt-0.5">{new Date(item.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-content-muted">No recent activity</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
