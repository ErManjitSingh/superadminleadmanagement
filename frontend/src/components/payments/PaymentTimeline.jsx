import { motion } from 'framer-motion';
import {
  CheckCircle2, Mail, MessageCircle, FileText, UserCheck, Wallet, Bell, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatINR } from '../operations-manager/operationsUtils';

const ICONS = {
  lead_converted: Sparkles,
  advance_payment: Wallet,
  payment_received: Wallet,
  receipt_generated: FileText,
  whatsapp_sent: MessageCircle,
  email_sent: Mail,
  booking_created: CheckCircle2,
  operations_assigned: UserCheck,
  payment_reminder: Bell,
  booking_fully_paid: CheckCircle2,
  receipt_resent: Mail,
};

const COLORS = {
  lead_converted: 'bg-violet-500',
  advance_payment: 'bg-emerald-500',
  payment_received: 'bg-emerald-500',
  receipt_generated: 'bg-indigo-500',
  whatsapp_sent: 'bg-green-500',
  email_sent: 'bg-sky-500',
  booking_created: 'bg-teal-500',
  operations_assigned: 'bg-blue-500',
  payment_reminder: 'bg-amber-500',
  booking_fully_paid: 'bg-emerald-600',
  receipt_resent: 'bg-indigo-400',
};

export default function PaymentTimeline({ events = [], loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="rounded-2xl border border-dashed border-subtle p-10 text-center">
        <FileText className="w-10 h-10 text-content-muted mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-content-muted">No payment events yet</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-300 via-indigo-200 to-transparent dark:from-violet-700 dark:via-indigo-800" />
      <div className="space-y-4">
        {events.map((event, idx) => {
          const Icon = ICONS[event.type] || FileText;
          const dotColor = COLORS[event.type] || 'bg-slate-400';
          const when = new Date(event.createdAt);
          return (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="relative"
            >
              <div className={cn('absolute -left-6 top-3 w-[22px] h-[22px] rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900', dotColor)}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <div className="rounded-xl border border-subtle bg-surface/80 backdrop-blur-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-content-primary">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-content-muted mt-0.5">{event.description}</p>
                    )}
                  </div>
                  {event.amount > 0 && (
                    <span className="text-sm font-bold text-emerald-600 tabular-nums">{formatINR(event.amount)}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-content-muted">
                  <span>{event.actorName || 'System'}</span>
                  {event.actorRole && <span className="capitalize">· {event.actorRole.replace(/_/g, ' ')}</span>}
                  {event.department && <span className="capitalize">· {event.department}</span>}
                  {event.paymentMode && <span className="uppercase">· {event.paymentMode}</span>}
                  <span>· {when.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>{when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
