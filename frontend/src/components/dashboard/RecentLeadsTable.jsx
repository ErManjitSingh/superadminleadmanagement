import { Link } from 'react-router-dom';
import { ArrowUpRight, Phone, Inbox } from 'lucide-react';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import Avatar from '../ui/Avatar';
import DashboardPanel from './DashboardPanel';

export default function RecentLeadsTable({
  leads = [],
  title = 'Recent Leads',
  subtitle = 'Latest inquiries',
  viewAllHref = '/leads',
  emptyMessage = 'No leads to show',
  maxRows = 5,
  totalCount,
  embedded = false,
  showAgent = true,
}) {
  const visibleLeads = maxRows ? leads.slice(0, maxRows) : leads;
  const total = totalCount ?? leads.length;
  const hasMore = total > visibleLeads.length;

  const columns = [
    { key: 'customer', label: 'Customer', className: 'min-w-[180px] w-[28%]' },
    { key: 'destination', label: 'Destination', className: 'min-w-[110px] w-[14%]' },
    { key: 'budget', label: 'Budget', className: 'min-w-[100px] w-[12%]' },
    { key: 'travelDate', label: 'Travel Date', className: 'min-w-[100px] w-[12%]' },
    ...(showAgent
      ? [{ key: 'agent', label: 'Agent', className: 'min-w-[100px] w-[14%]' }]
      : [{ key: 'created', label: 'Created', className: 'min-w-[100px] w-[14%]' }]),
    { key: 'status', label: 'Status', className: 'min-w-[110px] w-[12%]' },
    { key: 'source', label: 'Source', className: 'min-w-[90px] w-[10%]' },
  ];

  const tableBody = visibleLeads.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Inbox className="w-10 h-10 text-content-muted/40 mb-3" />
      <p className="text-sm font-medium text-content-muted">{emptyMessage}</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] table-fixed border-collapse">
        <thead>
          <tr className="border-b border-subtle bg-surface-elevated/70">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-content-muted whitespace-nowrap first:pl-5 last:pr-5 ${col.className}`}
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
              className={`border-b border-subtle last:border-0 hover:bg-brand-500/[0.04] transition-colors align-middle ${
                i % 2 === 1 ? 'bg-surface-elevated/30' : ''
              }`}
            >
              <td className="px-4 py-3.5 first:pl-5">
                <Link to={`/leads/${lead._id}`} className="flex items-center gap-2.5 group min-w-0">
                  <Avatar name={lead.name} size="sm" className="!w-8 !h-8 !text-xs shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content-primary truncate group-hover:text-brand-600 transition-colors">
                      {lead.name}
                    </p>
                    <p className="text-[11px] text-content-muted flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 shrink-0" />
                      {lead.phone}
                    </p>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3.5 text-sm text-content-secondary truncate">{lead.destination || '—'}</td>
              <td className="px-4 py-3.5 text-sm font-semibold metric-tabular whitespace-nowrap">
                ₹{(lead.budget || 0).toLocaleString('en-IN')}
              </td>
              <td className="px-4 py-3.5 text-sm text-content-muted whitespace-nowrap">
                {lead.travelDate
                  ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </td>
              {showAgent ? (
                <td className="px-4 py-3.5 text-xs text-content-secondary truncate">
                  {lead.assignedTo?.name || 'Unassigned'}
                </td>
              ) : (
                <td className="px-4 py-3.5 text-xs text-content-muted whitespace-nowrap">
                  {lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '—'}
                </td>
              )}
              <td className="px-4 py-3.5">
                <LeadStatusBadge status={lead.status} pulse={lead.status === 'new'} size="sm" />
              </td>
              <td className="px-4 py-3.5 last:pr-5">
                <span className="text-xs text-content-muted truncate block">
                  {lead.sourceShort || lead.sourceLabel || lead.source || '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const viewAllLink = (
    <Link to={viewAllHref} className="text-xs font-medium text-brand-600 hover:underline inline-flex items-center gap-1">
      View all{hasMore ? ` (${total})` : ''} <ArrowUpRight className="w-3.5 h-3.5" />
    </Link>
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
    <DashboardPanel
      title={title}
      subtitle={hasMore ? `${subtitle} · Showing ${visibleLeads.length} of ${total}` : subtitle}
      noPadding
      action={viewAllLink}
    >
      {tableBody}
    </DashboardPanel>
  );
}
