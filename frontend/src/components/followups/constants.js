import {
  CalendarClock,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const FOLLOWUP_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-amber-800 bg-gradient-to-r from-amber-400/25 to-orange-400/15 border-amber-400/50 shadow-sm shadow-amber-500/10' },
  { value: 'completed', label: 'Completed', color: 'text-emerald-800 bg-gradient-to-r from-emerald-400/25 to-teal-400/15 border-emerald-400/50 shadow-sm shadow-emerald-500/10' },
  { value: 'missed', label: 'Missed', color: 'text-red-800 bg-gradient-to-r from-red-400/25 to-rose-400/15 border-red-400/50 shadow-sm shadow-red-500/10' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'text-violet-800 bg-gradient-to-r from-violet-400/25 to-purple-400/15 border-violet-400/50 shadow-sm shadow-violet-500/10' },
];

export const FOLLOWUP_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-slate-700 bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/40' },
  { value: 'medium', label: 'Medium', color: 'text-sky-800 bg-gradient-to-r from-sky-400/25 to-cyan-400/15 border-sky-400/50 shadow-sm shadow-sky-500/10' },
  { value: 'high', label: 'High', color: 'text-amber-800 bg-gradient-to-r from-amber-400/25 to-yellow-400/15 border-amber-400/50 shadow-sm shadow-amber-500/10' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-800 bg-gradient-to-r from-red-400/30 to-orange-400/15 border-red-400/50 shadow-sm shadow-red-500/15 animate-pulse' },
];

export const FOLLOWUP_OUTCOMES = [
  'Interested — needs quotation',
  'Not reachable',
  'Requested callback later',
  'Price negotiation ongoing',
  'Ready to book',
  'Not interested',
  'Converted to customer',
  'Rescheduled per customer request',
];

export const FOLLOWUP_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

/** Pipeline: warm → cold → converted → expected conversion */
export const FOLLOWUP_CATEGORIES = [
  { value: 'warm', label: 'Warm', color: 'text-orange-800 bg-gradient-to-r from-orange-400/25 to-amber-400/15 border-orange-400/50' },
  { value: 'cold', label: 'Cold', color: 'text-sky-800 bg-gradient-to-r from-sky-400/25 to-cyan-400/15 border-sky-400/50' },
  { value: 'converted', label: 'Converted', color: 'text-emerald-800 bg-gradient-to-r from-emerald-400/25 to-teal-400/15 border-emerald-400/50' },
  { value: 'expected_conv', label: 'Expected Conversion', color: 'text-violet-800 bg-gradient-to-r from-violet-400/25 to-purple-400/15 border-violet-400/50' },
];

export const KPI_CONFIG = [
  { key: 'today', label: "Today's Follow-ups", icon: CalendarClock, color: 'brand' },
  { key: 'missed', label: 'Missed Follow-ups', icon: AlertTriangle, color: 'red' },
  { key: 'upcoming', label: 'Upcoming Follow-ups', icon: CalendarDays, color: 'violet' },
  { key: 'completed', label: 'Completed Follow-ups', icon: CheckCircle2, color: 'emerald' },
  { key: 'conversion', label: 'Conversion Rate', icon: TrendingUp, color: 'amber', suffix: '%' },
];

export const PRIORITY_COLORS = {
  low: '#64748b',
  medium: '#0ea5e9',
  high: '#f59e0b',
  urgent: '#ef4444',
};

export const STATUS_COLORS = {
  pending: '#f59e0b',
  completed: '#10b981',
  missed: '#ef4444',
  rescheduled: '#8b5cf6',
};
