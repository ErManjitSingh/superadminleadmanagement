import { useAuth } from '../../context/AuthContext';
import PageHeader from '../ui/PageHeader';
import Avatar from '../ui/Avatar';
import { Mail, Building2, Shield, Trophy } from 'lucide-react';

export default function ManagerProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Manager Profile" description="Your account and team oversight settings" breadcrumbs={['Sales Manager', 'Profile']} />

      <div className="rounded-2xl border border-subtle bg-surface/80 backdrop-blur-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-violet-600/20 via-brand-500/15 to-sky-500/20" />
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
            { icon: Trophy, label: 'Access Level', value: 'Team Management & Approvals' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-surface-elevated/50 border border-subtle">
              <div className="p-2 rounded-lg bg-violet-500/10"><Icon className="w-4 h-4 text-violet-600" /></div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">{label}</p>
                <p className="text-sm font-medium text-content-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
