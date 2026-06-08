import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin, IndianRupee } from 'lucide-react';
import LeadStatusBadge from './LeadStatusBadge';
import Avatar from '../ui/Avatar';
import { formatLeadId } from './constants';

export default function LeadKanbanCard({ lead, onClick, canDrag = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead._id,
    data: { lead, status: lead.status },
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onClick(lead)}
      className="group rounded-xl border border-subtle bg-surface p-3.5 shadow-sm hover:shadow-md hover:border-brand-500/20 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] text-brand-600 font-medium">{formatLeadId(lead._id)}</span>
        {canDrag ? (
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-content-muted hover:text-content-primary cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>
      <p className="text-sm font-semibold text-content-primary mb-2">{lead.name}</p>
      <div className="flex items-center gap-1.5 text-xs text-content-muted mb-1">
        <MapPin className="w-3 h-3 shrink-0" /> {lead.destination}
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-content-secondary mb-3">
        <IndianRupee className="w-3 h-3 shrink-0" /> {lead.budget?.toLocaleString('en-IN')}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-subtle">
        <div className="flex items-center gap-1.5">
          <Avatar name={lead.assignedTo?.name || 'U'} size="sm" className="!w-5 !h-5 !text-[8px]" />
          <span className="text-[10px] text-content-muted truncate max-w-[80px]">{lead.assignedTo?.name?.split(' ')[0] || '—'}</span>
        </div>
        <LeadStatusBadge status={lead.status} size="sm" />
      </div>
    </div>
  );
}
