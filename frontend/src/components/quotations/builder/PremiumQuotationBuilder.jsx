import { useEffect, useRef, useState, useCallback } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { Button } from '../../ui/button';
import QuotationPdfOverlay from '../QuotationPdfOverlay';
import { HOTEL_CATEGORIES, MEAL_PLANS, isNoHotelMealPlan } from '../constants';
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
import { BUILDER_STEPS, VEHICLE_TYPES } from './builderConstants';
import { toast } from '../../../context/ToastContext';
import { logWhatsAppContact } from '../../../services/whatsappTemplatesApi';
import {
  shareQuotationWithPdf,
  emailQuotationPdf,
  downloadServerQuotationPdf,
  previewServerQuotationPdf,
  regenerateServerQuotationPdf,
} from '../quotationShare';
import { deleteQuotationPdf, getApiErrorMessage } from '../../../services/quotationsApi';

const HOTEL_STEP = 3;

function getNextStep(step, noHotel) {
  if (step === 2 && noHotel) return 4;
  return Math.min(6, step + 1);
}

function getPrevStep(step, noHotel) {
  if (step === 4 && noHotel) return 2;
  return Math.max(1, step - 1);
}

export default function PremiumQuotationBuilder({ mode = 'executive' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLeadId = searchParams.get('leadId');
  const pdfRef = useRef(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const b = useQuotationBuilder({ mode, initialLeadId });
  const noHotel = isNoHotelMealPlan(b.state.packageInfo?.mealPlan);
  const visibleSteps = BUILDER_STEPS.filter((s) => !(noHotel && s.id === HOTEL_STEP));

  const resolveQuotationId = useCallback(async () => {
    if (b.draftId) return b.draftId;
    if (b.ensureDraftSaved) return b.ensureDraftSaved();
    return null;
  }, [b]);

  const handleSendWhatsApp = useCallback(async () => {
    const lead = b.selectedLead;
    const phone = lead?.whatsapp || lead?.phone;
    if (!phone) {
      toast.error('Customer phone number missing. Add phone on the lead first.');
      return;
    }

    setSharingPdf(true);
    try {
      try {
        if (b.state.leadId && b.config.contactEndpoint) {
          await logWhatsAppContact(b.state.leadId, {}, b.config.contactEndpoint);
        }
      } catch {
        /* optional activity log */
      }

      await shareQuotationWithPdf({
        quotationId: b.draftId,
        savePath: b.config.savePath,
        ensureQuotationId: b.ensureDraftSaved,
        phone,
      });
    } finally {
      setSharingPdf(false);
    }
  }, [b]);

  const handleSendEmail = useCallback(async () => {
    const lead = b.selectedLead;
    if (!lead?.email) {
      toast.error('Customer email missing. Add email on the lead first.');
      return;
    }
    setPdfBusy(true);
    try {
      await emailQuotationPdf({
        quotationId: b.draftId,
        savePath: b.config.savePath,
        ensureQuotationId: b.ensureDraftSaved,
        to: lead.email,
      });
    } finally {
      setPdfBusy(false);
    }
  }, [b]);

  const handleDownloadPdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      const id = await resolveQuotationId();
      if (!id) {
        toast.error('Save the quotation first, then download the PDF.');
        return;
      }
      const name = b.draftQuote?.quoteNumber || 'quotation';
      await downloadServerQuotationPdf(id, `${name}.pdf`, b.config.savePath);
      toast.success('PDF downloaded.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not download PDF.'));
    } finally {
      setPdfBusy(false);
    }
  }, [b.config.savePath, b.draftQuote?.quoteNumber, resolveQuotationId]);

  const handlePreviewPdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      const id = await resolveQuotationId();
      if (!id) {
        setPdfPreviewOpen(true);
        return;
      }
      await previewServerQuotationPdf(id, b.config.savePath);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not preview PDF.'));
      setPdfPreviewOpen(true);
    } finally {
      setPdfBusy(false);
    }
  }, [b.config.savePath, resolveQuotationId]);

  const handleRegeneratePdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      const id = await resolveQuotationId();
      if (!id) {
        toast.error('Save the quotation first, then regenerate the PDF.');
        return;
      }
      const result = await regenerateServerQuotationPdf(id, b.config.savePath);
      toast.success(`PDF regenerated (v${result?.pdfVersion || ''})`.trim());
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not regenerate PDF.'));
    } finally {
      setPdfBusy(false);
    }
  }, [b.config.savePath, resolveQuotationId]);

  const handleDeletePdf = useCallback(async () => {
    setPdfBusy(true);
    try {
      const id = await resolveQuotationId();
      if (!id) {
        toast.error('No saved quotation PDF to delete.');
        return;
      }
      await deleteQuotationPdf(id, b.config.savePath);
      toast.success('Quotation PDF deleted.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not delete PDF.'));
    } finally {
      setPdfBusy(false);
    }
  }, [b.config.savePath, resolveQuotationId]);

  const goNext = () => b.setStep((s) => getNextStep(s, noHotel));
  const goBack = () => b.setStep((s) => getPrevStep(s, noHotel));

  useEffect(() => {
    if (noHotel && b.step === HOTEL_STEP) {
      b.setStep(4);
    }
  }, [noHotel, b.step, b.setStep]);

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
              disabled={!b.draftQuote || pdfBusy}
              onClick={handlePreviewPdf}
            >
              <Eye className="w-4 h-4" /> Preview PDF
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3 lg:hidden">
          <div className="flex gap-1 overflow-x-auto">
            {visibleSteps.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => s.id <= b.maxReached && b.setStep(s.id)}
                className={cn(
                  'shrink-0 h-1.5 rounded-full transition-all',
                  b.step === s.id ? 'w-8 bg-sky-500' : s.id <= b.maxReached ? 'w-4 bg-sky-300' : 'w-4 bg-slate-200'
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
            <BuilderStepNav
              step={b.step}
              maxReached={b.maxReached}
              onStepChange={b.setStep}
              hiddenStepIds={noHotel ? [HOTEL_STEP] : []}
            />
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
                {b.step === 1 && <StepPackage b={b} initialLeadId={initialLeadId} />}
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
                {b.step === 3 && !noHotel && (
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
                    onFinish={handleFinish}
                    onOpenPreview={handlePreviewPdf}
                    onSendWhatsApp={handleSendWhatsApp}
                    onSendEmail={handleSendEmail}
                    onDownloadPdf={handleDownloadPdf}
                    onRegeneratePdf={handleRegeneratePdf}
                    onDeletePdf={handleDeletePdf}
                    sharingPdf={sharingPdf}
                    pdfBusy={pdfBusy}
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

function StepPackage({ b, initialLeadId }) {
  const info = b.state.packageInfo;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black">Package Information</h2>
        <p className="text-sm text-content-muted mt-1">Start from a template or pick a catalog package</p>
      </div>

      {initialLeadId && b.loadingLead && (
        <GlassCard className="p-4">
          <p className="text-sm text-content-muted flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Loading lead details…
          </p>
        </GlassCard>
      )}

      {initialLeadId && !b.loadingLead && b.leadLoadError && (
        <GlassCard className="p-4 border border-red-500/30 bg-red-500/5">
          <p className="text-sm text-red-700">{b.leadLoadError}</p>
          <Link
            to={b.config.leadDetailPath?.(initialLeadId) || b.config.backPath}
            className="text-sm text-sky-600 font-semibold mt-2 inline-block"
          >
            Back to lead
          </Link>
        </GlassCard>
      )}

      {b.selectedLead && (
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-content-muted">Lead</p>
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

      {!initialLeadId && !b.selectedLead && (
        <GlassCard className="p-4 text-center space-y-2">
          <p className="text-sm text-content-muted">Open the quotation builder from a lead to continue.</p>
          <Link to={b.config.backPath} className="text-sm text-sky-600 font-semibold">
            Back to leads
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
        <SelectField
          label="Meal Plan"
          value={info.mealPlan}
          options={MEAL_PLANS}
          onChange={(v) => {
            const skipHotel = isNoHotelMealPlan(v);
            b.updatePackageInfo({
              mealPlan: v,
              ...(skipHotel ? { hotelCategory: '' } : {}),
            });
            b.updateBuilderUi({ skipHotel });
          }}
        />
        {!isNoHotelMealPlan(info.mealPlan) && (
          <SelectField
            label="Hotel Category"
            value={info.hotelCategory}
            options={HOTEL_CATEGORIES}
            onChange={(v) => b.updatePackageInfo({ hotelCategory: v })}
          />
        )}
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

function StepPreviewSend({
  b,
  onFinish,
  onOpenPreview,
  onSendWhatsApp,
  onSendEmail,
  onDownloadPdf,
  onRegeneratePdf,
  onDeletePdf,
  sharingPdf,
  pdfBusy,
}) {
  const total = b.state.pricing?.grandTotal || b.state.pricing?.total || 0;
  const info = b.state.packageInfo || {};
  const noHotel = isNoHotelMealPlan(info.mealPlan);
  const destList = b.hotelDestination ? [{ name: b.hotelDestination }] : [];
  const hotels = noHotel || b.builderUi.skipHotel ? [] : builderUiToHotels(b.builderUi, destList);
  const transport = builderUiToTransport(b.builderUi);
  const itinerary = b.customItinerary || [];
  const customerPhone = b.selectedLead?.whatsapp || b.selectedLead?.phone;
  const customerEmail = b.selectedLead?.email;
  const busy = sharingPdf || pdfBusy;

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

          {b.builderUi.skipHotel && !noHotel && (
            <p className="text-sm text-content-muted italic">Hotels skipped</p>
          )}

          {noHotel && (
            <p className="text-sm text-content-muted italic">No hotel included in this package</p>
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
            disabled={!b.draftQuote || busy}
            onClick={onOpenPreview}
          >
            <Eye className="w-5 h-5" /> Preview PDF
          </Button>
        </div>
      </GlassCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={!b.draftQuote || busy}
          onClick={onOpenPreview}
        >
          <Eye className="w-4 h-4" /> Preview PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={!b.draftQuote || busy}
          onClick={onDownloadPdf}
        >
          <Download className="w-4 h-4" /> Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={!b.draftQuote || busy}
          onClick={onRegeneratePdf}
        >
          <Sparkles className="w-4 h-4" /> Regenerate PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2 text-rose-700 border-rose-200 hover:bg-rose-50"
          disabled={!b.draftQuote || busy}
          onClick={onDeletePdf}
        >
          Delete PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={!customerEmail || busy}
          title={!customerEmail ? 'Add customer email on lead' : 'Email quotation PDF attachment'}
          onClick={onSendEmail}
        >
          <Mail className="w-4 h-4" /> Send Email
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-800"
          disabled={!customerPhone || sharingPdf}
          title={
            !customerPhone
              ? 'Add customer phone on lead'
              : 'Send quotation PDF document via WhatsApp Business API'
          }
          onClick={onSendWhatsApp}
        >
          {sharingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          {sharingPdf ? 'Sending…' : 'Send on WhatsApp'}
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
