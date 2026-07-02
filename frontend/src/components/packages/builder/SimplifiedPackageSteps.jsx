import { useState } from 'react';
import { Plus, Trash2, Upload, Save, FileText, MapPin } from 'lucide-react';
import { Button } from '../../ui/button';
import { HOTEL_CATEGORIES, PACKAGE_TYPES } from '../../quotations/constants';
import { formatINR } from '../../quotations/quotationUtils';
import { readHotelImageFile } from '../../quotations/hotelImageUtils';
import GlassCard from '../../quotations/builder/GlassCard';
import AiItineraryGenerator from '../../builder-shared/AiItineraryGenerator';
import SimplifiedHotelSection from '../../builder-shared/SimplifiedHotelSection';
import SimplifiedTransportSection from '../../builder-shared/SimplifiedTransportSection';
import SimplifiedPricingSection from '../../builder-shared/SimplifiedPricingSection';
import {
  PACKAGE_STATUS_OPTIONS,
  DEFAULT_DESTINATIONS,
  DIFFICULTY_OPTIONS,
} from './packageBuilderConstants';
import { cn } from '../../../lib/utils';

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <label className="text-[10px] uppercase font-bold text-content-muted tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function inputCls(extra = '') {
  return cn('input-premium w-full h-10 rounded-xl text-sm', extra);
}

function CoverImageUpload({ coverImage, onChange, label }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-bold text-content-muted mb-2">{label}</p>
      <div className="flex gap-3 items-start">
        <div className="w-28 h-28 rounded-2xl bg-surface-elevated overflow-hidden border border-subtle shrink-0">
          {coverImage ? (
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">📷</div>
          )}
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-subtle text-sm cursor-pointer hover:bg-white/50">
          <Upload className="w-4 h-4" /> Upload cover
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              try {
                onChange(await readHotelImageFile(file));
              } catch {
                /* ignore */
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function StepBasics({ b }) {
  const s = b.state;
  const destinations = s.destinations || [];

  const addDest = (preset) => {
    const item = preset || { name: '', state: s.state || 'Himachal Pradesh', country: 'India', image: '' };
    b.setDestinations([...destinations, { ...item, id: `dest-${Date.now()}` }]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">Basic Details</h2>
        <p className="text-sm text-content-muted">Package name, destination & duration — keep it quick</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Package Name *" className="sm:col-span-2">
          <input
            value={s.name}
            onChange={(e) => b.update({ name: e.target.value })}
            className={inputCls()}
            placeholder="Himachal Honeymoon Special"
          />
        </Field>
        <Field label="Destination *">
          <input value={s.destination} onChange={(e) => b.update({ destination: e.target.value })} className={inputCls()} />
        </Field>
        <Field label="Days *">
          <input
            type="number"
            min={1}
            value={s.days || s.duration}
            onChange={(e) => {
              const days = Number(e.target.value) || 1;
              b.update({ days, duration: days, nights: Math.max(0, days - 1) });
            }}
            className={inputCls()}
          />
        </Field>
        <Field label="Nights">
          <input
            type="number"
            min={0}
            value={s.nights}
            onChange={(e) => b.update({ nights: Number(e.target.value) })}
            className={inputCls()}
          />
        </Field>
        <Field label="Package Type">
          <select value={s.packageType} onChange={(e) => b.update({ packageType: e.target.value })} className={inputCls()}>
            {PACKAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={s.status} onChange={(e) => b.update({ status: e.target.value })} className={inputCls()}>
            {PACKAGE_STATUS_OPTIONS.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Short Description">
        <textarea
          value={s.shortDescription}
          onChange={(e) => b.update({ shortDescription: e.target.value })}
          rows={2}
          className={inputCls('h-auto py-2 resize-none')}
        />
      </Field>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] uppercase font-bold text-content-muted">Route Stops (optional)</p>
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => addDest()}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {DEFAULT_DESTINATIONS.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => addDest(d)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-subtle hover:bg-amber-500/10"
            >
              + {d.name}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {destinations.map((dest, index) => (
            <div key={dest.id || index} className="flex gap-2 items-center">
              <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              <input
                value={dest.name}
                onChange={(e) => {
                  const next = [...destinations];
                  next[index] = { ...dest, name: e.target.value };
                  b.setDestinations(next);
                }}
                className={inputCls('h-9')}
                placeholder="Destination"
              />
              <button
                type="button"
                onClick={() => b.setDestinations(destinations.filter((_, i) => i !== index))}
                className="p-2 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <CoverImageUpload coverImage={s.coverImage} onChange={(url) => b.update({ coverImage: url })} label="Cover Image" />
    </div>
  );
}

export function StepAiItinerary({ b }) {
  const ui = b.builderUi;
  return (
    <AiItineraryGenerator
      prompt={ui.aiPrompt}
      onPromptChange={(aiPrompt) => b.updateBuilderUi({ aiPrompt })}
      itinerary={b.state.itinerary}
      onItineraryChange={b.setItinerary}
      destination={b.state.destination}
      days={b.state.days || b.state.duration}
      nights={b.state.nights}
      onDurationChange={({ days, nights }) => b.update({ days, duration: days, nights })}
    />
  );
}

export function StepHotelsSimplified({ b }) {
  return (
    <SimplifiedHotelSection
      builderUi={b.builderUi}
      onChange={b.updateBuilderUi}
      destinations={b.state.destinations}
    />
  );
}

export function StepTransportSimplified({ b }) {
  return (
    <SimplifiedTransportSection
      builderUi={b.builderUi}
      onChange={b.updateBuilderUi}
      cabs={b.cabs}
    />
  );
}

export function StepPricingSimplified({ b }) {
  return (
    <SimplifiedPricingSection
      totalCost={b.state.pricing?.finalPrice || 0}
      internalNotes={b.builderUi.internalNotes}
      onTotalChange={b.updatePricing}
      onNotesChange={(internalNotes) => b.updateBuilderUi({ internalNotes })}
    />
  );
}

export function StepPreviewSimplified({ b, previewMode, setPreviewMode }) {
  const pkg = b.draftPreview;
  const [pdfLoading, setPdfLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Preview & Save</h2>
          <p className="text-sm text-content-muted">Review before publishing</p>
        </div>
        <div className="flex gap-2">
          {['desktop', 'mobile'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPreviewMode(mode)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize',
                previewMode === mode ? 'bg-amber-500 text-white' : 'bg-surface-elevated'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className={cn('p-6', previewMode === 'mobile' && 'max-w-sm mx-auto')}>
        <h3 className="text-2xl font-black">{pkg.name || 'Untitled Package'}</h3>
        <p className="text-sm text-content-muted mt-1">
          {pkg.destination} · {pkg.days}D / {pkg.nights}N
        </p>
        <p className="text-2xl font-black text-emerald-700 mt-4">{formatINR(pkg.pricing?.finalPrice || 0)}</p>

        <div className="mt-6 space-y-4">
          <section>
            <h4 className="text-xs font-bold uppercase text-content-muted mb-2">Itinerary</h4>
            {(pkg.itinerary || []).map((d) => (
              <div key={d.day} className="mb-2 text-sm">
                <span className="font-bold text-violet-700">Day {d.day}:</span> {d.title}
              </div>
            ))}
          </section>

          {pkg.hotels?.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase text-content-muted mb-2">Hotels</h4>
              {pkg.hotels.map((h, i) => (
                <p key={i} className="text-sm">{h.name} · {h.roomType} · {h.mealPlan}</p>
              ))}
            </section>
          )}

          {pkg.transport?.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase text-content-muted mb-2">Transport</h4>
              {pkg.transport.map((t, i) => (
                <p key={i} className="text-sm">{t.vehicle} · {formatINR(t.cost)}</p>
              ))}
            </section>
          )}
        </div>
      </GlassCard>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-subtle">
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => b.setStep(1)}>
          Edit
        </Button>
        <Button
          type="button"
          className="rounded-xl gap-2"
          disabled={b.saving}
          onClick={() => b.save('draft')}
        >
          <Save className="w-4 h-4" /> Save Package
        </Button>
        <Button
          type="button"
          variant="sky"
          className="rounded-xl gap-2"
          disabled={b.saving || pdfLoading}
          onClick={async () => {
            setPdfLoading(true);
            await b.publish('published');
            setPdfLoading(false);
          }}
        >
          <FileText className="w-4 h-4" /> Publish
        </Button>
      </div>
    </div>
  );
}
