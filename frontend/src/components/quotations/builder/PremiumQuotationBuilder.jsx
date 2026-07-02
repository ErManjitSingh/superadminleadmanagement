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
  Pencil,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../ui/button';
import Avatar from '../../ui/Avatar';
import QuotationPdfOverlay from '../QuotationPdfOverlay';
import { HOTEL_CATEGORIES, MEAL_PLANS } from '../constants';
import { formatINR } from '../quotationUtils';
import { cn } from '../../../lib/utils';
import { useQuotationBuilder } from './useQuotationBuilder';
import BuilderStepNav from './BuilderStepNav';
import GlassCard from './GlassCard';
import AiItineraryGenerator from '../../builder-shared/AiItineraryGenerator';
import SimplifiedHotelSection from '../../builder-shared/SimplifiedHotelSection';
import SimplifiedTransportSection from '../../builder-shared/SimplifiedTransportSection';
import SimplifiedPricingSection from '../../builder-shared/SimplifiedPricingSection';
import { builderUiToHotels, builderUiToTransport } from '../../builder-shared/builderUiUtils';
import { VEHICLE_TYPES } from './builderConstants';

export default function PremiumQuotationBuilder({ mode = 'executive' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLeadId = searchParams.get('leadId');
  const pdfRef = useRef(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const b = useQuotationBuilder({ mode, initialLeadId });

  const goNext = () => b.setStep((s) => Math.min(6, s + 1));
  const goBack = () => b.setStep((s) => Math.max(1, s - 1));

  const canContinue = () => {
    if (b.step === 1) return b.state.leadId && (b.state.packageId || b.state.templateKey);
    if (b.step === 2) return (b.customItinerary || []).length > 0;
    return true;
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

        <div className="max-w-6xl mx-auto px-4 pb-3 lg:hidden">
          <div className="flex gap-1 overflow-x-auto">
            {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => n <= b.maxReached && b.setStep(n)}
                className={cn(
                  'shrink-0 h-1.5 rounded-full transition-all',
                  b.step === n ? 'w-8 bg-sky-500' : n <= b.maxReached ? 'w-4 bg-sky-300' : 'w-4 bg-slate-200'
                )}
              />
            ))}
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
                  <AiItineraryGenerator
                    prompt={b.builderUi.aiPrompt}
                    onPromptChange={(aiPrompt) => b.updateBuilderUi({ aiPrompt })}
                    itinerary={b.customItinerary}
                    onItineraryChange={b.setCustomItinerary}
                    destination={b.hotelDestination}
                    days={b.state.packageInfo?.duration}
                    nights={Math.max(0, (Number(b.state.packageInfo?.duration) || 4) - 1)}
                    onDurationChange={({ days, nights }) => b.updatePackageInfo({ duration: days })}
                  />
                )}
                {b.step === 3 && (
                  <SimplifiedHotelSection
                    builderUi={b.builderUi}
                    onChange={b.updateBuilderUi}
                    destinations={b.hotelDestination ? [{ name: b.hotelDestination }] : []}
                  />
                )}
                {b.step === 4 && (
                  <SimplifiedTransportSection
                    builderUi={b.builderUi}
                    onChange={b.updateBuilderUi}
                    cabs={b.cabs}
                  />
                )}
                {b.step === 5 && (
                  <SimplifiedPricingSection
                    totalCost={b.state.pricing?.total || 0}
                    internalNotes={b.builderUi.internalNotes}
                    onTotalChange={b.updatePricingTotal}
                    onNotesChange={(internalNotes) => b.updateBuilderUi({ internalNotes })}
                  />
                )}
                {b.step === 6 && (
                  <StepPreviewSend
                    b={b}
                    shareUrl={shareUrl}
                    onFinish={handleFinish}
                    onOpenPreview={() => setPdfPreviewOpen(true)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {b.step < 6 && (
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

function StepPreviewSend({ b, shareUrl, onFinish, onOpenPreview }) {
  const total = b.state.pricing?.grandTotal || b.state.pricing?.total || 0;
  const info = b.state.packageInfo || {};
  const destList = b.hotelDestination ? [{ name: b.hotelDestination }] : [];
  const hotels = b.builderUi.skipHotel ? [] : builderUiToHotels(b.builderUi, destList);
  const transport = builderUiToTransport(b.builderUi);
  const itinerary = b.customItinerary || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Preview & Send</h2>
          <p className="text-sm text-content-muted">Review itinerary, hotels, transport & pricing before sharing</p>
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

      <GlassCard className="p-6 sm:p-8 bg-gradient-to-br from-sky-500/5 via-white/50 to-indigo-500/5 border-sky-400/20">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-content-primary">
            {info.packageName || b.activePkg?.name || 'Your travel quotation'}
          </h3>
          <p className="text-sm text-content-muted mt-1">
            {info.destination || b.hotelDestination || '—'} · {info.duration || '—'} days
            {b.selectedLead?.name ? ` · ${b.selectedLead.name}` : ''}
          </p>
          {total > 0 && (
            <p className="text-3xl font-black text-emerald-600 metric-tabular mt-4">{formatINR(total)}</p>
          )}
        </div>

        <div className="space-y-5 text-left">
          {itinerary.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase text-content-muted mb-2">Itinerary</h4>
              <div className="space-y-2">
                {itinerary.map((d) => (
                  <div key={d.day || d.id} className="text-sm rounded-xl bg-white/40 dark:bg-slate-800/40 p-3 border border-white/30">
                    <p className="font-bold text-violet-700">Day {d.day}: {d.title}</p>
                    {d.description && <p className="text-content-muted mt-1 text-xs leading-relaxed">{d.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hotels.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase text-content-muted mb-2">Hotels</h4>
              {hotels.map((h, i) => (
                <p key={i} className="text-sm py-1">
                  {h.name} · {h.roomType} · {h.mealPlan}
                </p>
              ))}
            </section>
          )}

          {b.builderUi.skipHotel && (
            <p className="text-sm text-content-muted italic">Hotels skipped</p>
          )}

          {transport.length > 0 && (
            <section>
              <h4 className="text-xs font-bold uppercase text-content-muted mb-2">Transport</h4>
              {transport.map((t, i) => (
                <p key={i} className="text-sm">
                  {t.vehicle} · {formatINR(t.cost)}
                  {t.vehicleCount > 1 ? ` · ${t.vehicleCount} vehicles` : ''}
                </p>
              ))}
            </section>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6 pt-6 border-t border-white/30">
          <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={() => b.setStep(1)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <Button
            type="button"
            variant="sky"
            className="rounded-xl gap-2 shadow-lg shadow-sky-500/25"
            disabled={!b.draftQuote}
            onClick={onOpenPreview}
          >
            <Eye className="w-5 h-5" /> Generate PDF
          </Button>
        </div>
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
