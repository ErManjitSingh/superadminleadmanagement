import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadKanbanCard from './LeadKanbanCard';

function KanbanColumn({ column, leads, onCardClick, canDragLead }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.value });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-content-primary">{column.label}</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-elevated text-content-muted metric-tabular">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border border-dashed p-2 space-y-2 min-h-[400px] transition-colors ${
          isOver ? 'border-brand-500 bg-brand-500/5' : 'border-subtle bg-surface-elevated/30'
        }`}
      >
        <SortableContext items={leads.map((l) => l._id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadKanbanCard
              key={lead._id}
              lead={lead}
              onClick={onCardClick}
              canDrag={canDragLead ? canDragLead(lead) : true}
            />
          ))}
        </SortableContext>
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-content-muted">Drop leads here</div>
        )}
      </div>
    </div>
  );
}

export default function LeadKanbanBoard({ columns, leadsByStatus, onCardClick, canDragLead }) {
  return (
    <div className="overflow-x-auto pb-4 -mx-1 px-1">
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => (
          <KanbanColumn
            key={col.value}
            column={col}
            leads={leadsByStatus[col.value] || []}
            onCardClick={onCardClick}
            canDragLead={canDragLead}
          />
        ))}
      </div>
    </div>
  );
}
