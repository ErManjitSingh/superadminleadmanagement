import { Link } from 'react-router-dom';
import { ArrowUpRight, Phone, Inbox } from 'lucide-react';
import StatusBadge from '../StatusBadge';
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
}) {
  const visibleLeads = maxRows ? leads.slice(0, maxRows) : leads;
  const total = totalCount ?? leads.length;
  const hasMore = total > visibleLeads.length;

  return (
    <DashboardPanel
      title={title}
      subtitle={
        hasMore
          ? `${subtitle} · Showing ${visibleLeads.length} of ${total}`
          : subtitle
      }
      noPadding
      action={
        <Link to={viewAllHref} className="text-xs font-medium text-brand-600 hover:underline inline-flex items-center gap-1">
          View all{hasMore ? ` (${total})` : ''} <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
    >
      {visibleLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <Inbox className="w-10 h-10 text-content-muted/40 mb-3" />
          <p className="text-sm font-medium text-content-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-subtle bg-surface-elevated/60">
                {['Customer', 'Destination', 'Budget', 'Travel Date', 'Agent', 'Status', 'Source'].map((col) => (
                  <th key={col} className="text-left px-5 py-3 text-[11px] font-medium text-content-muted whitespace-nowrap first:pl-5">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead, i) => (
                <tr
                  key={lead._id}
                  className={`border-b border-subtle last:border-0 hover:bg-brand-500/[0.03] transition-colors ${i % 2 === 1 ? 'bg-white dark:bg-slate-800/50' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <Link to={`/leads/${lead._id}`} className="flex items-center gap-2.5 group">
                      <Avatar name={lead.name} size="sm" className="!w-8 !h-8 !text-xs" />
                      <div>
                        <p className="text-sm font-medium text-content-primary group-hover:text-brand-600 transition-colors">{lead.name}</p>
                        <p className="text-[11px] text-content-muted flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-content-secondary">{lead.destination}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold metric-tabular">₹{lead.budget?.toLocaleString('en-IN')}</td>
                  <td className="px-5 py-3.5 text-sm text-content-muted whitespace-nowrap">
                    {lead.travelDate ? new Date(lead.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-content-secondary">{lead.assignedTo?.name || 'Unassigned'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={lead.status} pulse={lead.status === 'new'} /></td>
                  <td className="px-5 py-3.5"><span className="text-xs text-content-muted">{lead.sourceShort || lead.sourceLabel || lead.source}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}
