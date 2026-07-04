import {
  BarChart3,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  TrendingUp,
  Users,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../ui/PageHeader';
import { Button } from '../ui/button';
import { SectionCard } from './paymentsUi';
import { formatINRFull } from './paymentsUtils';
import { cn } from '../../lib/utils';

const REPORTS = [
  { id: 'revenue', title: 'Revenue Report', icon: TrendingUp, gradient: 'from-violet-500 to-indigo-600' },
  { id: 'executive', title: 'Executive Wise Collection', icon: Users, gradient: 'from-sky-500 to-blue-600' },
  { id: 'branch', title: 'Branch Wise Collection', icon: Building2, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'destination', title: 'Destination Wise Revenue', icon: MapPin, gradient: 'from-amber-500 to-orange-600' },
  { id: 'supplier', title: 'Supplier Expenses', icon: Wallet, gradient: 'from-rose-500 to-pink-600' },
  { id: 'profit', title: 'Monthly Profit', icon: BarChart3, gradient: 'from-cyan-500 to-teal-600' },
  { id: 'pending', title: 'Pending Collection', icon: FileText, gradient: 'from-fuchsia-500 to-purple-600' },
  { id: 'refund', title: 'Refund Report', icon: RotateCcw, gradient: 'from-lime-500 to-emerald-600' },
];

const EXEC_DATA = [
  { name: 'Priya', amount: 245000 },
  { name: 'Amit', amount: 198000 },
  { name: 'Sneha', amount: 176000 },
  { name: 'Rohit', amount: 142000 },
];

const BRANCH_DATA = [
  { name: 'Delhi', amount: 320000 },
  { name: 'Mumbai', amount: 280000 },
  { name: 'Bangalore', amount: 210000 },
];

const DEST_DATA = [
  { name: 'Manali', amount: 185000 },
  { name: 'Goa', amount: 162000 },
  { name: 'Kashmir', amount: 145000 },
  { name: 'Kerala', amount: 98000 },
];

export default function PaymentReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Reports"
        description="Revenue, collections, expenses, and refund analytics"
        breadcrumbs={['Payments', 'Reports']}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-1.5">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" className="gap-1.5">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" className="gap-1.5">
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="flex items-center gap-3 rounded-2xl border border-subtle bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow', r.gradient)}>
              <r.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-content-primary">{r.title}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Executive Wise Collection" data={EXEC_DATA} color="#8B5CF6" />
        <ChartCard title="Branch Wise Collection" data={BRANCH_DATA} color="#06B6D4" />
        <ChartCard title="Destination Wise Revenue" data={DEST_DATA} color="#10B981" />
      </div>
    </div>
  );
}

function ChartCard({ title, data, color }) {
  return (
    <SectionCard title={title}>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-content-muted/20" />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
            <YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => formatINRFull(v)} />
            <Bar dataKey="amount" fill={color} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
