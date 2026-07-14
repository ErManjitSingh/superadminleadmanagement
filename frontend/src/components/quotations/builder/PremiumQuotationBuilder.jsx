import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Car,
  ChevronDown,
  Cloud,
  CloudOff,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  Tag,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '../../ui/button';
import Avatar from '../../ui/Avatar';
import QuotationPdfOverlay from '../QuotationPdfOverlay';
import QuotePdfPreview from '../QuotePdfPreview';
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
import { BUILDER_STEPS, GUEST_COUNT_OPTIONS, TEMPLATE_TAGLINES, VEHICLE_TYPES } from './builderConstants';
import { useAuth } from '../../../context/AuthContext';
import { toast } from '../../../context/ToastContext';
import { buildQuotationShareUrl } from '../../../lib/whatsappContact';
import { logWhatsAppContact } from '../../../services/whatsappTemplatesApi';
import { shareQuotationWithPdf, warmQuotationPdfBlob } from '../quotationShare';
import { downloadQuotationPdf } from '../exportQuotationPdf';
import { isMobileDevice } from '../../../lib/whatsappContact';

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
  const exportPdfRef = useRef(null);
  const pdfBlobCacheRef = useRef(null);
  const [pdfCacheReady, setPdfCacheReady] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

  const b = useQuotationBuilder({ mode, initialLeadId });
  const { user } = useAuth();
  const noHotel = isNoHotelMealPlan(b.state.packageInfo?.mealPlan);
  const visibleSteps = BUILDER_STEPS.filter((s) => !(noHotel && s.id === HOTEL_STEP));

  const shareUrl = b.shareToken ? buildQuotationShareUrl(b.shareToken) : '';

  const pdfWarmKey = useMemo(
    () =>
      JSON.stringify({
        step: b.step,
        leadId: b.state.leadId,
        packageId: b.state.packageId,
        templateKey: b.state.templateKey,
        total: b.state.pricing?.grandTotal,
        itinerary: b.customItinerary?.length,
        packageName: b.state.packageInfo?.packageName,
      }),
    [b.step, b.state, b.customItinerary?.length],
  );

  useEffect(() => {
    if (b.step !== 6 || !b.draftQuote || !exportPdfRef.current) {
      pdfBlobCacheRef.current = null;
      setPdfCacheReady(false);
      return undefined;
    }

    let cancelled = false;
    setPdfCacheReady(false);
    const timer = setTimeout(() => {
      warmQuotationPdfBlob(exportPdfRef.current).then((blob) => {
        if (cancelled) return;
        pdfBlobCacheRef.current = blob;
        setPdfCacheReady(Boolean(blob?.size));
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pdfWarmKey, b.draftQuote, b.step]);

  const handleSendWhatsApp = useCallback(async () => {
    const lead = b.selectedLead;
    const phone = lead?.whatsapp || lead?.phone;
    if (!phone) {
      toast.error('Customer phone number missing. Add phone on the lead first.');
      return;
    }
    if (!exportPdfRef.current) {
      toast.error('Quotation preview not ready. Wait a moment and try again.');
      return;
    }
    if (isMobileDevice() && !pdfCacheReady) {
      toast.info('PDF ready ho rahi hai… 2-3 second wait karein, phir dubara try karein.');
      return;
    }

    setSharingPdf(true);
    try {
      const info = b.state.packageInfo || {};
      const total = Number(b.state.pricing?.grandTotal || b.state.pricing?.total) || 0;

      try {
        if (b.state.leadId && b.config.contactEndpoint) {
          await logWhatsAppContact(b.state.leadId, {}, b.config.contactEndpoint);
        }
      } catch {
        /* optional */
      }

      await shareQuotationWithPdf({
        contentEl: exportPdfRef.current,
        prebuiltBlob: pdfBlobCacheRef.current,
        quotationId: b.draftId,
        savePath: b.config.savePath,
        ensureQuotationId: b.ensureDraftSaved,
        phone,
        lead,
        packageName: info.packageName || b.activePkg?.name,
        destination: info.destination || b.hotelDestination,
        duration: info.duration,
        total,
        quoteNumber: b.draftQuote?.quoteNumber,
        executiveName: user?.name,
      });
    } finally {
      setSharingPdf(false);
    }
  }, [b, user?.name, pdfCacheReady]);

  const handleDownloadPdf = useCallback(async () => {
    if (!exportPdfRef.current) {
      setPdfPreviewOpen(true);
      toast.info('Open preview, then use Download PDF again.');
      return;
    }
    try {
      const name = b.draftQuote?.quoteNumber || 'quotation';
      await downloadQuotationPdf(exportPdfRef.current, `${name}.pdf`);
      toast.success('PDF downloaded.');
    } catch (err) {
      toast.error(err?.message || 'Could not generate PDF.');
    }
  }, [b.draftQuote?.quoteNumber]);

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

  const nextStepMeta = visibleSteps.find((s) => s.id === getNextStep(b.step, noHotel));
  const nextStepLabel = nextStepMeta?.title || 'Next';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fd]">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={b.config.backPath}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">Quotation Builder</h1>
              <p className="text-xs text-slate-500 truncate">
                {b.selectedLead?.name ? `${b.selectedLead.name} · ` : ''}
                Build & customize your travel package.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AutosaveBadge status={b.autosaveStatus} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 border-slate-200 bg-white hover:bg-slate-50"
              disabled={!b.draftQuote}
              onClick={() => setPdfPreviewOpen(true)}
            >
              <Eye className="w-4 h-4" /> Preview PDF
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-4 pt-1">
          <BuilderStepNav
            step={b.step}
            maxReached={b.maxReached}
            onStepChange={b.setStep}
            hiddenStepIds={noHotel ? [HOTEL_STEP] : []}
          />
        </div>
      </div>

      <QuotationPdfOverlay
        quote={b.draftQuote}
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        pdfRef={pdfRef}
      />

      {b.draftQuote && (
        <div
          aria-hidden
          className="fixed top-0 left-0 w-[794px] -z-10 pointer-events-none overflow-visible"
          style={{ opacity: 0.01, visibility: 'visible' }}
        >
          <QuotePdfPreview ref={exportPdfRef} quote={b.draftQuote} />
        </div>
      )}

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 sm:p-8 min-h-[520px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={b.step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
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
                  onDurationChange={({ days }) => b.updatePackageInfo({ duration: days })}
                />
              )}
              {b.step === 3 && !noHotel && (
                <SimplifiedHotelSection
                  builderUi={b.builderUi}
                  onChange={b.updateBuilderUi}
                  destinations={b.hotelDestination ? [{ name: b.hotelDestination }] : []}
                  durationDays={b.state.packageInfo?.duration}
                  catalogHotels={b.catalogHotels}
                  onCatalogHotelsChange={b.setCatalogHotels}
                />
              )}
              {b.step === 4 && (
                <SimplifiedTransportSection
                  builderUi={b.builderUi}
                  onChange={b.updateBuilderUi}
                  cabs={b.cabs}
                  catalogVendors={b.catalogVendors}
                  onCatalogVendorsChange={b.setCatalogVendors}
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
                  onSendWhatsApp={handleSendWhatsApp}
                  onDownloadPdf={handleDownloadPdf}
                  sharingPdf={sharingPdf}
                  pdfCacheReady={pdfCacheReady}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {b.step < 6 && (
            <div className="flex justify-between mt-8 pt-5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl gap-2 border-slate-200 bg-white hover:bg-slate-50 px-5"
                disabled={b.step === 1}
                onClick={goBack}
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl gap-2 px-6"
                disabled={!canContinue() || b.loadingPackageDetail}
                onClick={goNext}
              >
                Next: {nextStepLabel} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AutosaveBadge({ status }) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
        <Cloud className="w-3.5 h-3.5" /> Auto-saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100">
        <CloudOff className="w-3.5 h-3.5" /> Save failed
      </span>
    );
  }
  return null;
}

function StepPackage({ b, initialLeadId }) {
  const info = b.state.packageInfo;
  const [showCatalog, setShowCatalog] = useState(false);

  return (
    <div className="space-y-6">
      {initialLeadId && b.loadingLead && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-violet-600" /> Loading lead details…
          </p>
        </div>
      )}

      {initialLeadId && !b.loadingLead && b.leadLoadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{b.leadLoadError}</p>
          <Link
            to={b.config.leadDetailPath?.(initialLeadId) || b.config.backPath}
            className="text-sm text-violet-600 font-semibold mt-2 inline-block"
          >
            Back to lead
          </Link>
        </div>
      )}

      {b.selectedLead && (
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={b.selectedLead.name} size="lg" className="ring-2 ring-violet-200" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-slate-900 text-lg capitalize">{b.selectedLead.name}</p>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-violet-600 text-white">
                  Lead
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-0.5 flex items-center gap-3 flex-wrap">
                {b.selectedLead.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-violet-500" />
                    {b.selectedLead.phone}
                  </span>
                )}
                {b.selectedLead.destination && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-violet-500" />
                    {b.selectedLead.destination}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Link
            to={b.config.leadDetailPath?.(b.selectedLead._id) || '#'}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-violet-200 bg-white text-sm font-semibold text-violet-700 hover:bg-violet-50 shadow-sm shrink-0"
          >
            View Lead <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {!initialLeadId && !b.selectedLead && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-6 text-center space-y-2">
          <p className="text-sm text-slate-600">Open the quotation builder from a lead to continue.</p>
          <Link to={b.config.backPath} className="text-sm text-violet-600 font-semibold">
            Back to leads
          </Link>
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3">Quick Templates</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-thin">
          {b.templates.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => b.applyTemplate(t)}
              className={cn(
                'relative shrink-0 w-[130px] sm:w-[150px] aspect-[4/5] rounded-2xl overflow-hidden border text-left snap-start transition-all',
                b.state.templateKey === t.key
                  ? 'ring-2 ring-violet-500 ring-offset-2 border-violet-300 shadow-lg shadow-violet-500/20'
                  : 'border-slate-200 hover:border-violet-300 hover:shadow-md',
              )}
            >
              <img src={t.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-bold leading-tight">{t.name}</p>
                <p className="text-white/80 text-[10px] mt-0.5 leading-snug">
                  {TEMPLATE_TAGLINES[t.key] || t.destination}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {b.packages.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowCatalog((v) => !v)}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-violet-700 transition-colors"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showCatalog && 'rotate-180')} />
            Your Packages & Catalog
            <span className="text-xs font-medium text-slate-400">({b.packages.length})</span>
          </button>
          {showCatalog && (
            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto mt-2">
              {b.packages.map((p) => (
                <button
                  key={`${p._catalog || 'pkg'}-${p._id}`}
                  type="button"
                  onClick={() => b.selectPackage(p)}
                  className={cn(
                    'p-3 rounded-xl border text-left text-sm',
                    b.state.packageId === p._id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-200',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold truncate">{p.name}</p>
                    <span className={cn(
                      'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
                      p._catalog === 'local' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-sky-500/15 text-sky-700',
                    )}>
                      {p._catalog === 'local' ? 'CRM' : 'UNO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{formatINR(p.startingPrice)} · {p.duration || '—'} days</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <IconField
          label="Package Name"
          icon={Tag}
          value={info.packageName}
          onChange={(v) => b.updatePackageInfo({ packageName: v })}
        />
        <IconField
          label="Destination"
          icon={MapPin}
          value={info.destination}
          onChange={(v) => b.updatePackageInfo({ destination: v })}
        />
        <IconField
          label="Duration (Days)"
          icon={Calendar}
          type="number"
          value={info.duration}
          onChange={(v) => b.updatePackageInfo({ duration: Number(v) })}
        />
        <IconField
          label="Travel Date"
          icon={Calendar}
          type="date"
          value={info.travelDate?.slice?.(0, 10) || info.travelDate || ''}
          onChange={(v) => b.updatePackageInfo({ travelDate: v })}
        />
        <IconSelectField
          label="Adults"
          icon={Users}
          value={info.adults}
          options={GUEST_COUNT_OPTIONS}
          onChange={(v) => b.updatePackageInfo({ adults: Number(v) })}
        />
        <IconSelectField
          label="Children"
          icon={Users}
          value={info.children}
          options={GUEST_COUNT_OPTIONS}
          onChange={(v) => b.updatePackageInfo({ children: Number(v) })}
        />
        <IconSelectField
          label="Infants"
          icon={Users}
          value={info.infants}
          options={GUEST_COUNT_OPTIONS}
          onChange={(v) => b.updatePackageInfo({ infants: Number(v) })}
        />
        <IconSelectField
          label="Meal Plan"
          icon={UtensilsCrossed}
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
          <IconSelectField
            label="Hotel Category"
            icon={Building2}
            value={info.hotelCategory}
            options={HOTEL_CATEGORIES}
            onChange={(v) => b.updatePackageInfo({ hotelCategory: v })}
          />
        )}
        <IconSelectField
          label="Transportation"
          icon={Car}
          value={info.transportation}
          options={VEHICLE_TYPES}
          onChange={(v) => b.updatePackageInfo({ transportation: v })}
        />
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        <Toggle label="Flight Included" checked={info.flightIncluded} onChange={(v) => b.updatePackageInfo({ flightIncluded: v })} />
        <Toggle label="Visa Included" checked={info.visaIncluded} onChange={(v) => b.updatePackageInfo({ visaIncluded: v })} />
        <Toggle label="Insurance" checked={info.insuranceIncluded} onChange={(v) => b.updatePackageInfo({ insuranceIncluded: v })} />
      </div>
    </div>
  );
}

function StepPreviewSend({ b, shareUrl, onFinish, onOpenPreview, onSendWhatsApp, onDownloadPdf, sharingPdf, pdfCacheReady }) {
  const total = b.state.pricing?.grandTotal || b.state.pricing?.total || 0;
  const info = b.state.packageInfo || {};
  const noHotel = isNoHotelMealPlan(info.mealPlan);
  const destList = b.hotelDestination ? [{ name: b.hotelDestination }] : [];
  const hotels = noHotel || b.builderUi.skipHotel ? [] : builderUiToHotels(b.builderUi, destList);
  const transport = builderUiToTransport(b.builderUi);
  const itinerary = b.customItinerary || [];
  const customerPhone = b.selectedLead?.whatsapp || b.selectedLead?.phone;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Preview & Send</h2>
          <p className="text-sm text-slate-500">Review itinerary, hotels, transport & pricing before sharing</p>
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
            className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20"
            disabled={!b.draftQuote}
            onClick={onOpenPreview}
          >
            <Eye className="w-5 h-5" /> Preview PDF
          </Button>
        </div>
      </GlassCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl gap-2"
          disabled={!b.draftQuote}
          onClick={onDownloadPdf}
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
          className="rounded-xl gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-800"
          disabled={!customerPhone || sharingPdf || (isMobileDevice() && !pdfCacheReady)}
          title={
            !customerPhone
              ? 'Add customer phone on lead'
              : isMobileDevice() && !pdfCacheReady
                ? 'PDF prepare ho rahi hai…'
                : 'Generate PDF and share on WhatsApp'
          }
          onClick={onSendWhatsApp}
        >
          {sharingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
          {sharingPdf
            ? 'Sending…'
            : isMobileDevice() && !pdfCacheReady
              ? 'PDF ready ho rahi…'
              : 'WhatsApp + PDF'}
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

function IconField({ label, icon: Icon, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
        )}
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
        />
      </div>
    </div>
  );
}

function IconSelectField({ label, icon: Icon, value, options, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none z-10" />
        )}
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-9 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 outline-none transition-all appearance-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
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
