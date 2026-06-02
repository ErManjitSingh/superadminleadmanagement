import { Link } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { formatLeadId } from '../leads/constants';
import LeadStatusBadge from '../leads/LeadStatusBadge';
import { normalizeLeadStatus } from '../../utils/leadUtils';

export default function LeadDetailHeader({ lead }) {
  const status = normalizeLeadStatus(lead.status);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        <Link
          to="/leads"
          className="mt-1 p-2 rounded-xl border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-content-primary tracking-tight">{lead.name}</h1>
            <LeadStatusBadge status={status} pulse={status === 'new'} />
          </div>
          <p className="text-sm text-content-muted mt-0.5">
            {formatLeadId(lead._id)} · {lead.destination} · Lead 360
          </p>
        </div>
      </div>
      <button className="self-start sm:self-center p-2 rounded-xl border border-slate-500/30 bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400 transition-colors">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}
