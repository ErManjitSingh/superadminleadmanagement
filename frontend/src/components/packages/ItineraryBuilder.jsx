import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { defaultItineraryDay } from '../quotations/quotationUtils';

function SortableDay({ day, onChange, onRemove, canRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.85 : 1 };

  const update = (field, value) => onChange({ ...day, [field]: value });

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border border-subtle bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <button type="button" {...attributes} {...listeners} className="p-1.5 rounded-lg hover:bg-surface-elevated text-content-muted cursor-grab">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold">
          Day {day.day}
        </span>
        <input value={day.title} onChange={(e) => update('title', e.target.value)} placeholder="Day title" className="input-premium flex-1 h-9 rounded-lg text-sm font-medium" />
        {canRemove && (
          <button type="button" onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>
      <textarea value={day.description} onChange={(e) => update('description', e.target.value)} placeholder="Description" rows={2} className="input-premium w-full rounded-lg text-sm resize-none mb-3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: 'hotel', label: 'Hotel' },
          { key: 'activities', label: 'Activities' },
          { key: 'meals', label: 'Meals' },
          { key: 'transport', label: 'Transport' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-[10px] uppercase text-content-muted font-semibold">{label}</label>
            <input value={day[key]} onChange={(e) => update(key, e.target.value)} className="input-premium w-full h-9 rounded-lg text-xs mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ItineraryBuilder({ itinerary, onChange, destination = 'Destination' }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itinerary.findIndex((d) => d.id === active.id);
    const newIndex = itinerary.findIndex((d) => d.id === over.id);
    const reordered = arrayMove(itinerary, oldIndex, newIndex).map((d, i) => ({ ...d, day: i + 1 }));
    onChange(reordered);
  };

  const addDay = () => {
    onChange([...itinerary, defaultItineraryDay(itinerary.length + 1, destination)]);
  };

  const updateDay = (idx, day) => {
    const next = [...itinerary];
    next[idx] = day;
    onChange(next);
  };

  const removeDay = (idx) => {
    onChange(itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-content-primary">Day-wise Itinerary</p>
        <Button type="button" size="sm" variant="amber" onClick={addDay} className="rounded-lg h-8 gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Day
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itinerary.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
            {itinerary.map((day, idx) => (
              <SortableDay key={day.id} day={day} onChange={(d) => updateDay(idx, d)} onRemove={() => removeDay(idx)} canRemove={itinerary.length > 1} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
