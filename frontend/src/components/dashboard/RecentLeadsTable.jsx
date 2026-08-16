import { Link } from 'react-router-dom';
import { ArrowUpRight, Inbox } from 'lucide-react';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import DashboardPanel from './DashboardPanel';

function formatBudget(n) {
  if (!n) return '—';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function RecentLeadsTable({
  leads = [],
  title = 'Recent Leads',
  subtitle = 'Latest inquiries across your pipeline',
  viewAllHref = '/leads',
  emptyMessage = 'No leads to show',
  maxRows = 6,
  totalCount,
  embedded = false,
}) {
  const visibleLeads = maxRows ? leads.slice(0, maxRows) : leads;
  const total = totalCount ?? leads.length;
  const hasMore = total > visibleLeads.length;

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'source', label: 'Source' },
    { key: 'destination', label: 'Destination' },
    { key: 'budget', label: 'Budget' },
    { key: 'status', label: 'Status' },
    { key: 'assigned', label: 'Assigned To' },
    { key: 'created', label: 'Created On' },
  ];

  const viewAllLink = (
    <Link to={viewAllHref} className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
      View all{hasMore ? ` (${total})` : ''} <ArrowUpRight className="w-3.5 h-3.5" />
    </Link>
  );

  const tableBody = visibleLeads.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Inbox className="w-10 h-10 text-content-muted/40 mb-3" />
      <p className="text-sm font-medium text-content-muted">{emptyMessage}</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-subtle bg-slate-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-content-muted whitespace-nowrap first:pl-5 last:pr-5"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleLeads.map((lead, i) => (
            <tr
              key={lead._id}
              className={`border-b border-subtle last:border-0 hover:bg-blue-50/40 transition-colors ${
                i % 2 === 1 ? 'bg-slate-50/40' : ''
              }`}
            >
              <td className="px-4 py-3.5 first:pl-5">
                <Link
                  to={`/leads/${lead._id}`}
                  className="text-sm font-semibold text-content-primary hover:text-blue-600 truncate block max-w-[160px]"
                >
                  {lead.name}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-sm text-content-secondary whitespace-nowrap">
                {lead.sourceShort || lead.sourceLabel || lead.source || '—'}
              </td>
              <td className="px-4 py-3.5 text-sm text-content-secondary truncate max-w-[120px]">
                {lead.destination || '—'}
              </td>
              <td className="px-4 py-3.5 text-sm font-semibold metric-tabular whitespace-nowrap">
                {formatBudget(lead.budget)}
              </td>
              <td className="px-4 py-3.5">
                <LeadStatusBadge status={lead.status} pulse={lead.status === 'new'} size="sm" />
              </td>
              <td className="px-4 py-3.5 text-sm text-content-secondary truncate max-w-[120px]">
                {lead.assignedTo?.name || 'Unassigned'}
              </td>
              <td className="px-4 py-3.5 last:pr-5 text-sm text-content-muted whitespace-nowrap">
                {lead.createdAt
                  ? new Date(lead.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-subtle">
          <p className="text-xs text-content-muted">
            {hasMore ? `${subtitle} · Showing ${visibleLeads.length} of ${total}` : subtitle}
          </p>
          {viewAllLink}
        </div>
        {tableBody}
      </div>
    );
  }

  return (
    <DashboardPanel title={title} subtitle={subtitle} noPadding action={viewAllLink} className="h-full">
      {tableBody}
    </DashboardPanel>
  );
}
