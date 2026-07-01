import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { defaultItineraryDay } from '../quotationUtils';
import { cn } from '../../../lib/utils';

function SortableDay({ day, onChange, onRemove, onDuplicate, canRemove, collapsed, onToggleCollapse }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.9 : 1 };

  const update = (field, value) => onChange({ ...day, [field]: value });

  const addImage = () => {
    const url = window.prompt('Paste image URL');
    if (!url?.trim()) return;
    update('images', [...(day.images || []), url.trim()]);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-2xl border border-white/30 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md',
        'shadow-md shadow-black/5 overflow-hidden',
        isDragging && 'ring-2 ring-sky-400/50'
      )}
    >
      <div className="flex items-center gap-2 p-4 border-b border-white/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg hover:bg-white/50 text-content-muted cursor-grab"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-sm">
          Day {day.day}
        </span>
        <input
          value={day.title || ''}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Day title — e.g. Arrival at Shimla"
          className="input-premium flex-1 h-9 rounded-lg text-sm font-semibold"
        />
        <button type="button" onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-white/50 text-content-muted">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
        <button type="button" onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-sky-500/10 text-sky-600" title="Duplicate day">
          <Copy className="w-4 h-4" />
        </button>
        {canRemove && (
          <button type="button" onClick={onRemove} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-content-muted tracking-wider">Description</label>
            <textarea
              value={day.description || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Rich description for this day..."
              rows={4}
              className="input-premium w-full rounded-xl text-sm resize-none mt-1"
            />
          </div>

          {(day.images || []).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {day.images.map((img, i) => (
                <div key={img} className="relative group">
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-xl border border-subtle" />
                  <button
                    type="button"
                    onClick={() => update('images', day.images.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={addImage}>
            <ImagePlus className="w-3.5 h-3.5" /> Add Image
          </Button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'hotel', label: 'Hotel', placeholder: 'Hotel name' },
              { key: 'activities', label: 'Activities', placeholder: 'Sightseeing, etc.' },
              { key: 'meals', label: 'Meals', placeholder: 'Breakfast, Dinner' },
              { key: 'transport', label: 'Transport', placeholder: 'Private cab' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="rounded-xl border border-subtle/50 bg-white/40 dark:bg-slate-800/30 p-2.5">
                <label className="text-[10px] uppercase text-content-muted font-bold">{label}</label>
                <input
                  value={day[key] || ''}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  className="input-premium w-full h-9 rounded-lg text-xs mt-1"
                />
              </div>
            ))}
          </div>

          <textarea
            value={day.notes || ''}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Additional notes for this day..."
            rows={2}
            className="input-premium w-full rounded-xl text-xs resize-none"
          />
        </div>
      )}
    </div>
  );
}

export default function TimelineItineraryBuilder({ itinerary, onChange, destination = 'Destination' }) {
  const [collapsedDays, setCollapsedDays] = useState({});
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const toggleCollapse = (id) => {
    setCollapsedDays((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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

  const duplicateDay = (idx) => {
    const source = itinerary[idx];
    const copy = {
      ...source,
      id: `day-${Date.now()}-copy`,
      title: `${source.title || `Day ${source.day}`} (copy)`,
      images: [...(source.images || [])],
    };
    const next = [...itinerary];
    next.splice(idx + 1, 0, copy);
    onChange(next.map((d, i) => ({ ...d, day: i + 1 })));
  };

  const removeDay = (idx) => {
    onChange(itinerary.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-content-primary">Day-wise Timeline</p>
          <p className="text-xs text-content-muted mt-0.5">Drag to reorder · Collapse · Duplicate days</p>
        </div>
        <Button type="button" size="sm" variant="amber" onClick={addDay} className="rounded-xl h-9 gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" /> Add Day
        </Button>
      </div>

      <div className="relative pl-4 border-l-2 border-dashed border-amber-400/40 space-y-4 ml-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={itinerary.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            {itinerary.map((day, idx) => (
              <div key={day.id} className="relative">
                <div className="absolute -left-[21px] top-5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                <SortableDay
                  day={day}
                  onChange={(d) => updateDay(idx, d)}
                  onRemove={() => removeDay(idx)}
                  onDuplicate={() => duplicateDay(idx)}
                  canRemove={itinerary.length > 1}
                  collapsed={!!collapsedDays[day.id]}
                  onToggleCollapse={() => toggleCollapse(day.id)}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
