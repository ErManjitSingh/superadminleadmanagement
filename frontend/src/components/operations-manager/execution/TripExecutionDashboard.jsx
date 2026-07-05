import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Plane, Clock, CheckCircle2, Ticket,
  Hotel, Car, Compass, PlaneTakeoff, BookOpen, Building2,
  ListTodo, Bell, AlertTriangle,
} from 'lucide-react';
import PageHeader from '../../ui/PageHeader';
import { fetchVoucherAnalytics } from '../../../services/operationsVoucherApi';
import { cn } from '../../../lib/utils';

function StatCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className={cn('rounded-3xl border border-white/20 p-5 shadow-lg backdrop-blur-sm bg-gradient-to-br', gradient)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">{label}</p>
          <p className="text-3xl font-black text-white mt-1 tabular-nums">{value ?? 0}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { path: '/operations-manager/trips/active', label: 'Active Trips', icon: Plane },
  { path: '/operations-manager/vouchers', label: 'All Vouchers', icon: Ticket },
  { path: '/operations-manager/vendors/confirmations', label: 'Vendor Confirmations', icon: Building2 },
  { path: '/operations-manager/operations/alerts', label: 'Alerts', icon: Bell },
];

export default function TripExecutionDashboard() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchVoucherAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Trip Execution"
        description="Central command for vouchers, vendors and trip readiness"
        breadcrumbs={['Operations', 'Trip Execution']}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Vouchers Today" value={analytics?.generatedToday} icon={Ticket} gradient="from-indigo-600 to-violet-700" />
        <StatCard label="Pending Vendor" value={analytics?.pendingConfirmations} icon={Clock} gradient="from-amber-500 to-orange-600" />
        <StatCard label="Ready To Travel" value={analytics?.tripsReadyToTravel} icon={Plane} gradient="from-emerald-500 to-teal-600" />
        <StatCard label="Rejected" value={analytics?.rejectedVouchers} icon={AlertTriangle} gradient="from-rose-500 to-pink-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-2xl border border-subtle bg-surface/80 p-4 hover:border-indigo-400/40 hover:shadow-md transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-semibold text-sm">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export const tripExecutionNavExports = {
  LayoutDashboard,
  Plane,
  Clock,
  CheckCircle2,
  Ticket,
  Hotel,
  Car,
  Compass,
  PlaneTakeoff,
  BookOpen,
  Building2,
  ListTodo,
  Bell,
  AlertTriangle,
};
