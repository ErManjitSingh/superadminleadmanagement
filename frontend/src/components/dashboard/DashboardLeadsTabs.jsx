import { useState } from 'react';
import { motion } from 'framer-motion';
import RecentLeadsTable from './RecentLeadsTable';

const TABS = [
  {
    id: 'new',
    label: "Today's Leads",
    subtitle: "Today's fresh inquiries",
    viewAllHref: '/leads/new-leads',
    emptyMessage: 'No new leads today',
  },
  {
    id: 'unassigned',
    label: 'Unassigned',
    subtitle: 'Leads waiting for assignment',
    viewAllHref: '/leads/unassigned',
    emptyMessage: 'No unassigned leads',
  },
];

export default function DashboardLeadsTabs({
  newLeads = [],
  newLeadsTotal = 0,
  unassignedLeads = [],
  unassignedLeadsTotal = 0,
  maxRows = 5,
}) {
  const [tab, setTab] = useState('new');
  const active = TABS.find((t) => t.id === tab) || TABS[0];

  const leads = tab === 'unassigned' ? unassignedLeads : newLeads;
  const totalCount = tab === 'unassigned' ? unassignedLeadsTotal : newLeadsTotal;

  return (
    <div className="space-y-0">
      <div className="rounded-2xl border border-subtle bg-surface shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-4 border-b border-subtle bg-surface-elevated/40">
          <div className="flex p-1 rounded-xl bg-surface-elevated border border-subtle w-fit">
            {TABS.map(({ id, label }) => {
              const count = id === 'unassigned' ? unassignedLeadsTotal : newLeadsTotal;
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-brand-700 dark:text-brand-300' : 'text-content-muted hover:text-content-primary'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="dashboard-leads-tab"
                      className="absolute inset-0 bg-surface rounded-lg shadow-sm border border-subtle"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">
                    {label}
                    <span className={`ml-1.5 text-xs font-semibold ${isActive ? 'text-brand-600' : 'text-content-muted'}`}>
                      ({count})
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <RecentLeadsTable
          embedded
          leads={leads}
          totalCount={totalCount}
          maxRows={maxRows}
          title={active.label}
          subtitle={active.subtitle}
          viewAllHref={active.viewAllHref}
          emptyMessage={active.emptyMessage}
          showAgent={tab !== 'unassigned'}
        />
      </div>
    </div>
  );
}
