import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Cloud,
  CloudOff,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../ui/button';
import Avatar from '../../ui/Avatar';
import DayWiseHotelSelector, { isDayWiseHotelsComplete } from '../DayWiseHotelSelector';
import InclusionExclusionEditor, { cleanInclusionExclusionLines } from '../InclusionExclusionEditor';
import QuotePricingPanel from '../QuotePricingPanel';
import QuotationPdfOverlay from '../QuotationPdfOverlay';
import { HOTEL_CATEGORIES, MEAL_PLANS } from '../constants';
import { formatINR } from '../quotationUtils';
import { cn } from '../../../lib/utils';
import { useQuotationBuilder } from './useQuotationBuilder';
import BuilderStepNav from './BuilderStepNav';
import TimelineItineraryBuilder from './TimelineItineraryBuilder';
import GlassCard from './GlassCard';
import {
  ACTIVITY_PRESETS,
  EXCLUSION_PRESETS,
  INCLUSION_PRESETS,
  VEHICLE_TYPES,
} from './builderConstants';

export default function PremiumQuotationBuilder({ mode = 'executive' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLeadId = searchParams.get('leadId');
  const pdfRef = useRef(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const b = useQuotationBuilder({ mode, initialLeadId });

  const goNext = () => b.setStep((s) => Math.min(12, s + 1));
  const goBack = () => b.setStep((s) => Math.max(1, s - 1));

  const canContinue = () => {
    if (b.step === 1) return b.state.leadId && (b.state.packageId || b.state.templateKey);
    if (b.step === 3) return isDayWiseHotelsComplete(b.dayWiseHotels, b.packageNights);
    return true;
  };

  const skipActivities = () => {
    b.setState((s) => ({ ...s, selectedActivityIds: [], activitiesSkipped: true }));
    b.setStep(6);
  };

  const handleFinish = async (saveAs) => {
    const data = await b.handleSubmit(saveAs);
    if (!data) return;
    navigate(b.config.successPath, {
      state: {
        message:
          data.status === 'approved'
            ? 'Quotation created and approved.'
            : data.status === 'pending_approval'
              ? 'Submitted to Team Leader for approval.'
              : 'Quotation saved.',
      },
    });
  };

  const shareUrl = b.shareToken
    ? `${window.location.origin}/quote/${b.shareToken}`
    : null;

  const toggleInclusionPreset = (text) => {
    const lines = cleanInclusionExclusionLines(b.customInclusions);
    if (lines.includes(text)) {
      b.setCustomInclusions(lines.filter((l) => l !== text));
    } else {
      b.setCustomInclusions([...lines, text]);
    }
  };

  const toggleExclusionPreset = (text) => {
    const lines = cleanInclusionExclusionLines(b.customExclusions);
    if (lines.includes(text)) {
      b.setCustomExclusions(lines.filter((l) => l !== text));
    } else {
      b.setCustomExclusions([...lines, text]);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-100 via-sky-50/80 to-indigo-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="sticky top-0 z-30 border-b border-white/30 bg-white/60 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={b.config.backPath}
              className="p-2 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-content-primary truncate">Quotation Builder</h1>
              <p className="text-xs text-content-muted truncate">
                {b.selectedLead?.name ? `${b.selectedLead.name} · ` : ''}
                Premium travel brochure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AutosaveBadge status={b.autosaveStatus} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 border-sky-400/40 bg-white/80"
              disabled={!b.draftQuote}
              onClick={() => setPdfPreviewOpen(true)}
            >
              <Eye className="w-4 h-4" /> Preview PDF
            </Button>
          </div>
        </div>
      </div>

      <QuotationPdfOverlay
        quote={b.draftQuote}
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        pdfRef={pdfRef}
      />

      <div className="max-w-6xl mx-auto p-4 flex gap-4">
        <aside className="hidden lg:block w-56 shrink-0">
          <GlassCard className="p-3 sticky top-20">
            <BuilderStepNav step={b.step} maxReached={b.maxReached} onStepChange={b.setStep} />
          </GlassCard>
        </aside>

        <main className="flex-1 min-w-0">
          <GlassCard className="p-6 sm:p-8 min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={b.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {b.step === 1 && <StepPackage b={b} />}
                {b.step === 2 && (
                  <TimelineItineraryBuilder
                    itinerary={b.customItinerary}
                    onChange={b.setCustomItinerary}
                    destination={b.hotelDestination}
                  />
                )}
                {b.step === 3 && (
                  <DayWiseHotelSelector
                    destination={b.hotelDestination}
                    value={b.dayWiseHotels}
                    onChange={b.handleDayWiseHotelChange}
                    nights={b.packageNights}
                  />
                )}
                {b.step === 4 && <StepTransport b={b} />}
                {b.step === 5 && <StepActivities b={b} skipActivities={skipActivities} />}
                {b.step === 6 && (
                  <InclusionChecklist
                    title="Inclusions"
                    presets={INCLUSION_PRESETS}
                    items={b.customInclusions}
                    onChange={b.setCustomInclusions}
                    onTogglePreset={toggleInclusionPreset}
                    accent="bg-emerald-500 text-white"
                  />
                )}
                {b.step === 7 && (
                  <InclusionChecklist
                    title="Exclusions"
                    presets={EXCLUSION_PRESETS}
                    items={b.customExclusions}
                    onChange={b.setCustomExclusions}
                    onTogglePreset={toggleExclusionPreset}
                    accent="bg-rose-500 text-white"
                  />
                )}
                {b.step === 8 && (
                  <QuotePricingPanel
                    pricing={b.state.pricing}
                    onChange={(p) => b.setState((s) => ({ ...s, pricing: p }))}
                  />
                )}
                {b.step === 9 && <StepPaymentPlan b={b} />}
                {b.step === 10 && <StepNotes b={b} />}
                {b.step === 11 && <StepCustomer b={b} />}
                {b.step === 12 && (
                  <StepPreviewSend
                    b={b}
                    shareUrl={shareUrl}
                    onFinish={handleFinish}
                    onOpenPreview={() => setPdfPreviewOpen(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {b.step < 12 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-white/30">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl gap-2"
                  disabled={b.step === 1}
                  onClick={goBack}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                  {b.step === 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl gap-2"
                      onClick={skipActivities}
                    >
                      <SkipForward className="w-4 h-4" /> Skip activities
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="sky"
                    className="rounded-xl gap-2 shadow-lg shadow-sky-500/20"
                    disabled={!canContinue() || b.loadingPackageDetail}
                    onClick={goNext}
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </main>
      </div>
    </div>
  );
}

function AutosaveBadge({ status }) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-content-muted px-2 py-1 rounded-lg bg-white/50">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 px-2 py-1 rounded-lg bg-emerald-500/10">
        <Cloud className="w-3.5 h-3.5" /> Auto-saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 px-2 py-1 rounded-lg bg-red-500/10">
        <CloudOff className="w-3.5 h-3.5" /> Save failed
      </span>
    );
  }
  return null;
}

function StepPackage({ b }) {
  const info = b.state.packageInfo;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">Package Information</h2>
        <p className="text-sm text-content-muted mt-1">Start from a template or pick a catalog package</p>
      </div>

      {!b.selectedLead && (
        <GlassCard className="p-4 space-y-3">
          <p className="text-sm font-bold">Select Lead</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted" />
            <input
              type="search"
              value={b.leadSearch}
              onChange={(e) => b.setLeadSearch(e.target.value)}
              placeholder="Search leads (min 2 chars)…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-subtle bg-white/50 text-sm"
            />
          </div>
          {b.loadingLeads ? (
            <p className="text-sm text-content-muted text-center py-4">Searching…</p>
          ) : (
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {b.leads.map((l) => (
                <button
                  key={l._id}
                  type="button"
                  onClick={() => b.selectLead(l)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-left',
                    b.state.leadId === l._id ? 'border-sky-500/50 bg-sky-500/10' : 'border-subtle'
                  )}
                >
                  <Avatar name={l.name} size="sm" />
                  <div>
                    <p className="font-semibold text-sm">{l.name}</p>
                    <p className="text-xs text-content-muted">{l.destination}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {b.selectedLead && (
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="font-bold">{b.selectedLead.name}</p>
            <p className="text-xs text-content-muted">
              {b.selectedLead.phone} · {b.selectedLead.destination}
            </p>
          </div>
          <Link
            to={b.config.leadDetailPath?.(b.selectedLead._id) || '#'}
            className="text-xs text-sky-600 flex items-center gap-1"
          >
            View <ExternalLink className="w-3 h-3" />
          </Link>
        </GlassCard>
      )}

      <div>
        <p className="text-sm font-bold mb-2">Quick Templates</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {b.templates.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => b.applyTemplate(t)}
              className={cn(
                'relative rounded-xl overflow-hidden border aspect-[4/3] text-left group',
                b.state.templateKey === t.key ? 'ring-2 ring-sky-500' : 'border-subtle'
              )}
            >
              <img src={t.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {b.packages.length > 0 && (
        <div>
          <p className="text-sm font-bold mb-2">Your Packages & Catalog</p>
          <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {b.packages.map((p) => (
              <button
                key={`${p._catalog || 'pkg'}-${p._id}`}
                type="button"
                onClick={() => b.selectPackage(p)}
                className={cn(
                  'p-3 rounded-xl border text-left text-sm',
                  b.state.packageId === p._id ? 'border-amber-500/50 bg-amber-500/10' : 'border-subtle'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold truncate">{p.name}</p>
                  <span className={cn(
                    'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
                    p._catalog === 'local' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-sky-500/15 text-sky-700'
                  )}>
                    {p._catalog === 'local' ? 'CRM' : 'UNO'}
                  </span>
                </div>
                <p className="text-xs text-content-muted">{formatINR(p.startingPrice)} · {p.duration || '—'} days</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Package Name" value={info.packageName} onChange={(v) => b.updatePackageInfo({ packageName: v })} />
        <Field label="Destination" value={info.destination} onChange={(v) => b.updatePackageInfo({ destination: v })} />
        <Field label="Duration (days)" type="number" value={info.duration} onChange={(v) => b.updatePackageInfo({ duration: Number(v) })} />
        <Field label="Travel Date" type="date" value={info.travelDate?.slice?.(0, 10) || info.travelDate || ''} onChange={(v) => b.updatePackageInfo({ travelDate: v })} />
        <Field label="Adults" type="number" value={info.adults} onChange={(v) => b.updatePackageInfo({ adults: Number(v) })} />
        <Field label="Children" type="number" value={info.children} onChange={(v) => b.updatePackageInfo({ children: Number(v) })} />
        <Field label="Infants" type="number" value={info.infants} onChange={(v) => b.updatePackageInfo({ infants: Number(v) })} />
        <SelectField label="Meal Plan" value={info.mealPlan} options={MEAL_PLANS} onChange={(v) => b.updatePackageInfo({ mealPlan: v })} />
        <SelectField label="Hotel Category" value={info.hotelCategory} options={HOTEL_CATEGORIES} onChange={(v) => b.updatePackageInfo({ hotelCategory: v })} />
        <SelectField label="Transportation" value={info.transportation} options={VEHICLE_TYPES} onChange={(v) => b.updatePackageInfo({ transportation: v })} />
      </div>

      <div className="flex flex-wrap gap-4">
        <Toggle label="Flight Included" checked={info.flightIncluded} onChange={(v) => b.updatePackageInfo({ flightIncluded: v })} />
        <Toggle label="Visa Included" checked={info.visaIncluded} onChange={(v) => b.updatePackageInfo({ visaIncluded: v })} />
        <Toggle label="Insurance" checked={info.insuranceIncluded} onChange={(v) => b.updatePackageInfo({ insuranceIncluded: v })} />
      </div>
    </div>
  );
}

function StepTransport({ b }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">Transport</h2>
        <p className="text-sm text-content-muted">Select cabs and flights for this quotation</p>
      </div>
      <p className="text-xs font-bold uppercase text-content-muted">Cabs & Vehicles</p>
      <div className="grid gap-2">
        {b.cabs.map((c) => (
          <button
            key={c._id}
            type="button"
            onClick={() => b.toggleId('selectedCabIds', c._id)}
            className={cn(
              'flex justify-between items-center p-4 rounded-xl border text-left transition-all',
              b.state.selectedCabIds.includes(c._id)
                ? 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-subtle hover:bg-white/50'
            )}
          >
            <div>
              <p className="font-semibold text-sm">{c.vehicleType || 'Cab'}</p>
              <p className="text-xs text-content-muted">
                {c.pickupLocation} → {c.dropLocation}
              </p>
              {(c.driverAllowance || c.toll || c.parking) && (
                <p className="text-[10px] text-content-muted mt-1">
                  {[c.driverAllowance && 'Driver', c.toll && 'Toll', c.parking && 'Parking'].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <span className="font-bold">{formatINR(c.cost)}</span>
          </button>
        ))}
      </div>
      <p className="text-xs font-bold uppercase text-content-muted pt-2">Flights</p>
      <div className="grid gap-2">
        {b.flights.map((f) => (
          <button
            key={f._id}
            type="button"
            onClick={() => b.toggleId('selectedFlightIds', f._id)}
            className={cn(
              'flex justify-between p-4 rounded-xl border text-left',
              b.state.selectedFlightIds.includes(f._id) ? 'border-sky-500/50 bg-sky-500/10' : 'border-subtle'
            )}
          >
            <span className="text-sm">{f.airline} {f.flightNumber}</span>
            <span className="font-bold">{formatINR(f.cost)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepActivities({ b, skipActivities }) {
  const skipped = b.state.activitiesSkipped;
  const hasActivities = b.availableActivities.length > 0;
  const selectedCount = b.state.selectedActivityIds.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl font-black">Activities</h2>
          <p className="text-sm text-content-muted">Add experiences to make the quote irresistible — or skip if not needed</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5 shrink-0" onClick={skipActivities}>
          <SkipForward className="w-3.5 h-3.5" /> Skip activities
        </Button>
      </div>

      {skipped && (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-sky-900 font-medium">Activities skipped — you can add them later or continue to inclusions.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => b.setState((s) => ({ ...s, activitiesSkipped: false }))}
          >
            Add activities
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ACTIVITY_PRESETS.map((preset) => (
          <div
            key={preset.name}
            className="rounded-xl border border-subtle bg-white/40 p-3 text-center text-xs font-medium"
          >
            <span className="text-2xl">{preset.icon}</span>
            <p className="mt-1">{preset.name}</p>
          </div>
        ))}
      </div>

      {!hasActivities ? (
        <div className="rounded-2xl border border-dashed border-subtle bg-surface-elevated/50 p-8 text-center space-y-4">
          <p className="text-sm text-content-muted">No activities found for this destination.</p>
          <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={skipActivities}>
            <SkipForward className="w-4 h-4" /> Skip &amp; continue to inclusions
          </Button>
        </div>
      ) : (
        <>
          {selectedCount > 0 && (
            <p className="text-xs font-semibold text-indigo-700">{selectedCount} activit{selectedCount === 1 ? 'y' : 'ies'} selected</p>
          )}
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {b.availableActivities.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => b.toggleId('selectedActivityIds', a._id)}
                className={cn(
                  'w-full flex justify-between p-4 rounded-xl border text-left',
                  b.state.selectedActivityIds.includes(a._id)
                    ? 'border-indigo-500/50 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                    : 'border-subtle'
                )}
              >
                <span className="text-sm font-medium">{a.name}</span>
                <span className="font-bold">{formatINR(a.price)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {hasActivities && (
        <div className="pt-4 border-t border-subtle flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-content-muted">Activities are optional for this quotation.</p>
          <Button type="button" variant="ghost" size="sm" className="rounded-xl gap-1.5 text-content-muted" onClick={skipActivities}>
            <SkipForward className="w-3.5 h-3.5" /> Skip &amp; continue
          </Button>
        </div>
      )}
    </div>
  );
}

function InclusionChecklist({ title, presets, items, onChange, onTogglePreset, accent }) {
  const active = cleanInclusionExclusionLines(items);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {presets.map((text) => {
          const on = active.includes(text);
          return (
            <button
              key={text}
              type="button"
              onClick={() => onTogglePreset(text)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                on ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-800' : 'border-subtle hover:bg-white/50'
              )}
            >
              {on ? '✓ ' : ''}{text}
            </button>
          );
        })}
      </div>
      <InclusionExclusionEditor
        mode={title === 'Inclusions' ? 'inclusions' : 'exclusions'}
        inclusions={title === 'Inclusions' ? items : []}
        exclusions={title === 'Exclusions' ? items : []}
        onChangeInclusions={title === 'Inclusions' ? onChange : () => {}}
        onChangeExclusions={title === 'Exclusions' ? onChange : () => {}}
      />
    </div>
  );
}

function StepPaymentPlan({ b }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Payment Plan</h2>
      <p className="text-sm text-content-muted">Editable installment breakdown — amounts update with pricing</p>
      <div className="grid gap-3">
        {b.state.paymentPlan.map((row, i) => (
          <GlassCard key={row.label} className="p-4 grid sm:grid-cols-3 gap-3 items-end">
            <Field label="Milestone" value={row.label} onChange={(v) => b.updatePaymentPlan(i, { label: v })} />
            <Field label="Percent %" type="number" value={row.percent} onChange={(v) => b.updatePaymentPlan(i, { percent: Number(v) })} />
            <div>
              <p className="text-[10px] uppercase font-bold text-content-muted">Amount</p>
              <p className="text-2xl font-black text-emerald-600 metric-tabular mt-1">{formatINR(row.amount)}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function StepNotes({ b }) {
  const notes = b.state.importantNotes;
  const fields = [
    { key: 'cancellationPolicy', label: 'Cancellation Policy' },
    { key: 'termsAndConditions', label: 'Terms & Conditions' },
    { key: 'travelGuidelines', label: 'Travel Guidelines' },
    { key: 'weather', label: 'Weather' },
    { key: 'packingTips', label: 'Packing Tips' },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Important Notes</h2>
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="text-xs font-bold text-content-muted">{label}</label>
          <textarea
            value={notes[key] || ''}
            onChange={(e) => b.updateImportantNotes({ [key]: e.target.value })}
            rows={3}
            className="input-premium w-full rounded-xl text-sm mt-1 resize-none"
          />
        </div>
      ))}
    </div>
  );
}

function StepCustomer({ b }) {
  const lead = b.selectedLead;
  if (!lead) {
    return <p className="text-content-muted text-center py-12">Select a lead in Step 1</p>;
  }
  const rows = [
    ['Customer Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['Lead Source', lead.source],
    ['Destination', lead.destination],
    ['Budget', formatINR(lead.budget)],
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black">Customer Details</h2>
      <p className="text-sm text-content-muted">Auto-fetched from lead — read only</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map(([label, value]) => (
          <GlassCard key={label} className="p-4">
            <p className="text-[10px] uppercase font-bold text-content-muted">{label}</p>
            <p className="font-semibold mt-1">{value || '—'}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function StepPreviewSend({ b, shareUrl, onFinish, onOpenPreview }) {
  const total = b.state.pricing?.grandTotal || b.state.pricing?.total || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Preview & Send</h2>
          <p className="text-sm text-content-muted">Review the brochure, then share with your customer</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => b.saveVersion()}>
            Save Version
          </Button>
          {(b.versions || []).map((v) => (
            <button
              key={v.versionNumber}
              type="button"
              onClick={() => b.restoreVersion(v.versionNumber)}
              className="text-xs px-2 py-1 rounded-lg border border-subtle hover:bg-white/50"
            >
              {v.label || `V${v.versionNumber}`}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="p-8 text-center bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-amber-500/10 border-sky-400/30">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-content-primary">
          {b.state.packageInfo?.packageName || b.activePkg?.name || 'Your travel quotation'}
        </h3>
        <p className="text-sm text-content-muted mt-1">
          {b.selectedLead?.name ? `Prepared for ${b.selectedLead.name}` : 'Select a lead to personalize'}
        </p>
        {total > 0 && (
          <p className="text-3xl font-black text-emerald-600 metric-tabular mt-4">{formatINR(total)}</p>
        )}
        <Button
          type="button"
          variant="sky"
          size="lg"
          className="rounded-xl gap-2 mt-6 shadow-lg shadow-sky-500/25"
          disabled={!b.draftQuote}
          onClick={onOpenPreview}
        >
          <Eye className="w-5 h-5" /> Preview PDF Brochure
        </Button>
        <p className="text-xs text-content-muted mt-3">Opens full-screen preview · Print or save as PDF from there</p>
      </GlassCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={!b.draftQuote}
          onClick={onOpenPreview}
        >
          <Download className="w-4 h-4" /> Download PDF
        </Button>
        {shareUrl && (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
          >
            <ExternalLink className="w-4 h-4" /> Copy Share Link
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => b.selectedLead?.email && (window.location.href = `mailto:${b.selectedLead.email}?subject=Travel Quotation`)}
        >
          <Mail className="w-4 h-4" /> Send Email
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => b.selectedLead?.phone && window.open(`https://wa.me/${b.selectedLead.phone.replace(/\D/g, '')}`, '_blank')}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-subtle">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={b.saving}
          onClick={() => onFinish('draft')}
        >
          <FileText className="w-4 h-4" /> {b.config.draftLabel}
        </Button>
        <Button
          type="button"
          variant="emerald"
          className="rounded-xl gap-2 shadow-lg shadow-emerald-500/20"
          disabled={b.saving}
          onClick={() => onFinish('submit')}
        >
          <Sparkles className="w-4 h-4" /> {b.config.submitLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold text-content-muted">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium w-full h-10 rounded-xl text-sm mt-1"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-[10px] uppercase font-bold text-content-muted">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium w-full h-10 rounded-xl text-sm mt-1"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-subtle text-sky-600 w-4 h-4"
      />
      {label}
    </label>
  );
}
