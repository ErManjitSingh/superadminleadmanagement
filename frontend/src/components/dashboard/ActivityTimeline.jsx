import { motion } from 'framer-motion';
import { UserPlus, UserCheck, CalendarPlus, RefreshCw, Trophy, FileText, Mail } from 'lucide-react';
import DashboardPanel from './DashboardPanel';

const config = {
  lead_created: { icon: UserPlus, color: 'bg-blue-500', label: 'New lead added' },
  lead_assigned: { icon: UserCheck, color: 'bg-violet-500', label: 'Lead assigned' },
  followup_added: { icon: CalendarPlus, color: 'bg-amber-500', label: 'Follow-up scheduled' },
  status_updated: { icon: RefreshCw, color: 'bg-indigo-500', label: 'Status updated' },
  lead_converted: { icon: Trophy, color: 'bg-emerald-500', label: 'Lead converted' },
  quotation_created: { icon: FileText, color: 'bg-sky-500', label: 'Quotation created' },
  email_sent: { icon: Mail, color: 'bg-orange-500', label: 'Email sent' },
};

function buildFallbackActivities(stats) {
  const items = [];
  if (stats.todayLeads > 0) {
    items.push({ type: 'lead_created', user: 'System', text: `${stats.todayLeads} new leads today`, time: 'Today' });
  }
  if (stats.convertedLeads > 0) {
    items.push({ type: 'lead_converted', user: 'Team', text: `${stats.convertedLeads} leads converted`, time: 'This month' });
  }
  if (stats.pendingFollowups > 0) {
    items.push({ type: 'followup_added', user: 'System', text: `${stats.pendingFollowups} follow-ups pending`, time: 'Active' });
  }
  if (stats.newLeads?.length) {
    stats.newLeads.slice(0, 3).forEach((lead) => {
      items.push({
        type: 'lead_created',
        user: lead.assignedTo?.name || 'System',
        text: `New lead: ${lead.name}`,
        time: 'Today',
      });
    });
  }
  return items.slice(0, 6);
}

export default function ActivityTimeline({ activities = [], stats }) {
  const items = activities.length ? activities : buildFallbackActivities(stats || {});

  return (
    <DashboardPanel title="Recent Activities" subtitle="Latest updates across your CRM">
      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-sm text-content-muted text-center py-6">No recent activity</p>
        ) : (
          items.map((item, i) => {
            const c = config[item.type] || config.status_updated;
            const Icon = c.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3 py-3 border-b border-subtle last:border-0"
              >
                <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-content-primary">
                    <span className="font-semibold">{item.user}</span>{' '}
                    <span className="text-content-secondary">{item.text || c.label}</span>
                  </p>
                  <p className="text-xs text-content-muted mt-0.5">{item.time}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </DashboardPanel>
  );
}
