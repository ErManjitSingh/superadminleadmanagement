import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, FileText, ExternalLink } from 'lucide-react';
import API from '../../api/axios';
import { Button } from '../ui/button';
import Avatar from '../ui/Avatar';
import ItineraryBuilder from '../packages/ItineraryBuilder';
import QuotePricingPanel from './QuotePricingPanel';
import UnoHotelSelector, { parsePackageNights } from './UnoHotelSelector';
import { WIZARD_STEPS } from './constants';
import { calculatePricing, defaultItineraryDay, defaultWizardState, formatINR } from './quotationUtils';
import { unwrapList } from '../../utils/apiHelpers';
import { cn } from '../../lib/utils';

const ADMIN_CONFIG = {
  leadsPath: '/leads',
  leadViewPath: (id) => `/leads/${id}`,
  savePath: '/quotations',
  backPath: '/quotations',
  successPath: '/quotations',
  title: 'Quotation Builder',
  subtitle: 'Salesforce CPQ-style quote wizard',
  draftStatus: 'draft',
  submitStatus: 'sent',
  draftLabel: 'Save Draft',
  submitLabel: 'Save & Send',
  approvalNote: null,
};

const EXECUTIVE_CONFIG = {
  leadsPath: '/sales-executive/leads/all',
  leadViewPath: (id) => `/sales-executive/leads/${id}/view`,
  savePath: '/sales-executive/quotations',
  backPath: '/sales-executive/quotations',
  successPath: '/sales-executive/quotations',
  title: 'Create Quotation',
  subtitle: 'First quote is auto-approved; revised quotes go to Team Leader for approval',
  draftStatus: 'draft',
  submitStatus: 'pending_approval',
  draftLabel: 'Save Draft',
  submitLabel: 'Submit Quotation',
  approvalNote: 'The first quotation for a lead is approved automatically. From the second quote onward, Team Leader approval is required before sending to the customer.',
};

const TEAM_LEADER_CONFIG = {
  leadsPath: '/team-leader/leads',
  leadViewPath: (id) => `/team-leader/leads/${id}/view`,
  leadsParams: { filter: 'all', page: 1, limit: 500 },
  savePath: '/team-leader/quotations',
  backPath: '/team-leader/quotations/pending',
  successPath: '/team-leader/quotations/approved',
  title: 'Create Quotation',
  subtitle: 'Create a quote for your team — approved immediately',
  draftStatus: 'draft',
  submitStatus: 'approved',
  draftLabel: 'Save Draft',
  submitLabel: 'Create & Approve',
  approvalNote: 'Executive can send the approved quote to the customer.',
};

const MANAGER_CONFIG = {
  leadsPath: '/sales-manager/leads',
  leadViewPath: (id) => `/sales-manager/leads/${id}/view`,
  leadsParams: { filter: 'all', page: 1, limit: 500 },
  savePath: '/sales-manager/quotations',
  backPath: '/sales-manager/quotations/pending',
  successPath: '/sales-manager/quotations/approved',
  title: 'Create Quotation',
  subtitle: 'Create a quote for any team lead in your branch',
  draftStatus: 'draft',
  submitStatus: 'approved',
  draftLabel: 'Save Draft',
  submitLabel: 'Create & Approve',
  approvalNote: 'Quote is approved on creation. Executive can send to customer.',
};

const CONFIG_BY_MODE = {
  executive: EXECUTIVE_CONFIG,
  team_leader: TEAM_LEADER_CONFIG,
  sales_manager: MANAGER_CONFIG,
  admin: ADMIN_CONFIG,
};

export default function QuotationBuilderWizard({ mode = 'executive' }) {
  const config = CONFIG_BY_MODE[mode] || EXECUTIVE_CONFIG;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLeadId = searchParams.get('leadId');
  const [step, setStep] = useState(1);
  const [leads, setLeads] = useState([]);
  const [packages, setPackages] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [flights, setFlights] = useState([]);
  const [activities, setActivities] = useState([]);
  const [state, setState] = useState({ ...defaultWizardState });
  const [customItinerary, setCustomItinerary] = useState([]);
  const [selectedPkgDetail, setSelectedPkgDetail] = useState(null);
  const [unoHotelSelection, setUnoHotelSelection] = useState(null);
  const [loadingPackageDetail, setLoadingPackageDetail] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBuilderData = async () => {
      const requests = [
        API.get(config.leadsPath, { params: config.leadsParams || { page: 1, limit: 500 }, skipErrorToast: true }),
        API.get('/cabs', { skipErrorToast: true }),
        API.get('/flights', { skipErrorToast: true }),
        API.get('/activities', { skipErrorToast: true }),
      ];

      const results = await Promise.allSettled(requests);
      if (cancelled) return;

      const pick = (index) => (results[index].status === 'fulfilled' ? results[index].value.data : []);

      setLeads(unwrapList(pick(0)));
      setCabs(unwrapList(pick(1)));
      setFlights(unwrapList(pick(2)));
      setActivities(unwrapList(pick(3)));
    };

    loadBuilderData().catch(() => {
      if (!cancelled) {
        setLeads([]);
        setCabs([]);
        setFlights([]);
        setActivities([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [config.leadsPath]);

  useEffect(() => {
    if (initialLeadId) {
      setState((s) => ({ ...s, leadId: initialLeadId }));
    }
  }, [initialLeadId]);

  const selectedLead = leads.find((l) => l._id === state.leadId);
  const selectedPkg = packages.find((p) => p._id === state.packageId);
  const activePkg = selectedPkgDetail || selectedPkg;
  const packageNights = parsePackageNights(activePkg);
  const hotelDestination = selectedLead?.destination || activePkg?.destination || '';

  useEffect(() => {
    const destination = selectedLead?.destination;
    if (!destination) {
      setPackages([]);
      return undefined;
    }

    let cancelled = false;
    setLoadingPackages(true);
    API.get('/uno-packages', {
      params: { limit: 50, destination },
      skipErrorToast: true,
    })
      .then((res) => {
        if (!cancelled) setPackages(unwrapList(res.data));
      })
      .catch(() => {
        if (!cancelled) setPackages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPackages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLead?.destination]);

  const selectLead = (lead) => {
    setState({ ...defaultWizardState, leadId: lead._id });
    setSelectedPkgDetail(null);
    setCustomItinerary([]);
    setUnoHotelSelection(null);
  };

  const buildFallbackItinerary = (detail) => {
    const days = Math.max(1, Number(detail.duration) || 1);
    const destination = detail.destination || 'Destination';
    return Array.from({ length: days }, (_, index) =>
      defaultItineraryDay(index + 1, destination)
    );
  };

  const applyPackageDetail = (detail) => {
    const itinerary =
      detail.itinerary?.length > 0 ? detail.itinerary : buildFallbackItinerary(detail);
    const normalized = { ...detail, itinerary };
    setSelectedPkgDetail(normalized);
    setCustomItinerary(itinerary.map((d) => ({ ...d })));
    setState((s) => ({
      ...s,
      pricing: {
        ...s.pricing,
        baseCost: normalized.startingPrice || 0,
        ...calculatePricing({ ...s.pricing, baseCost: normalized.startingPrice || 0 }),
      },
    }));
  };

  const selectPackage = async (pkg) => {
    setState((s) => ({ ...s, packageId: pkg._id }));
    setCustomItinerary([]);
    setSelectedPkgDetail(null);
    setLoadingPackageDetail(true);
    try {
      const res = await API.get(`/uno-packages/${pkg._id}`, { skipErrorToast: true });
      applyPackageDetail(res.data);
    } catch {
      applyPackageDetail(pkg);
    } finally {
      setLoadingPackageDetail(false);
    }
  };

  const toggleId = (key, id) => {
    setState((s) => {
      const arr = s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id];
      return { ...s, [key]: arr };
    });
  };

  useEffect(() => {
    const hotelCost = unoHotelSelection?.totalCost || 0;
    const cabCost = cabs.filter((c) => state.selectedCabIds.includes(c._id)).reduce((s, c) => s + (c.cost || 0), 0);
    const flightCost = flights.filter((f) => state.selectedFlightIds.includes(f._id)).reduce((s, f) => s + (f.cost || 0), 0);
    const activityCost = activities.filter((a) => state.selectedActivityIds.includes(a._id)).reduce((s, a) => s + (a.price || 0), 0);
    const calc = calculatePricing({ ...state.pricing, hotelCost, cabCost, flightCost, activityCost });
    setState((s) => ({ ...s, pricing: { ...s.pricing, hotelCost, cabCost, flightCost, activityCost, total: calc.total, profitMargin: calc.profitMargin } }));
  }, [state.selectedCabIds, state.selectedFlightIds, state.selectedActivityIds, cabs, flights, activities, state.pricing.baseCost, state.pricing.taxes, state.pricing.markup, state.pricing.discount, unoHotelSelection?.totalCost]);

  const handleSave = async (saveAs) => {
    if (!state.leadId || !state.packageId) return;
    const status = saveAs === 'draft' ? config.draftStatus : config.submitStatus;
    setSaving(true);
    try {
      const payload = {
        quoteNumber: `Q-${Date.now().toString().slice(-6)}`,
        leadId: state.leadId,
        packageId: state.packageId,
        status,
        pricing: state.pricing,
        selectedHotels: unoHotelSelection
          ? [{
              _id: unoHotelSelection.hotel?.id,
              name: unoHotelSelection.hotel?.name,
              location: unoHotelSelection.hotel?.location,
              city: unoHotelSelection.hotel?.city,
              thumbnailUrl: unoHotelSelection.hotel?.thumbnailUrl,
              images: unoHotelSelection.hotel?.images,
              room: unoHotelSelection.room,
              mealPlan: unoHotelSelection.mealPlan,
              nights: unoHotelSelection.nights,
              price: unoHotelSelection.perNight,
              total: unoHotelSelection.totalCost,
              externalSource: 'uno_hotels',
            }]
          : [],
        selectedCabs: cabs.filter((c) => state.selectedCabIds.includes(c._id)),
        selectedFlights: flights.filter((f) => state.selectedFlightIds.includes(f._id)),
        selectedActivities: activities.filter((a) => state.selectedActivityIds.includes(a._id)),
        package: { ...activePkg, itinerary: customItinerary },
        customizations: state.customizations,
      };
      const res = await API.post(config.savePath, payload);
      const successUrl =
        mode === 'executive'
          ? config.successPath
          : `${config.successPath}?view=${res.data._id}`;
      const savedStatus = res.data?.status;
      navigate(successUrl, {
        state: {
          message:
            savedStatus === 'approved'
              ? 'First quotation created and approved. You can send it to the customer.'
              : savedStatus === 'pending_approval'
                ? 'Quotation submitted to Team Leader for approval.'
                : 'Quotation saved as draft.',
        },
      });
    } catch (err) {
      /* toast via axios */
    } finally {
      setSaving(false);
    }
  };

  const draftQuote = selectedLead && activePkg ? {
    quoteNumber: 'PREVIEW',
    createdAt: new Date().toISOString(),
    lead: selectedLead,
    package: { ...activePkg, itinerary: customItinerary },
    pricing: state.pricing,
  } : null;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to={config.backPath} className="p-2 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">{config.title}</h1>
          <p className="text-sm text-content-muted">{config.subtitle}</p>
          {config.approvalNote && (
            <p className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 mt-2 max-w-xl">
              {config.approvalNote}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface/80 p-4 mb-6">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {WIZARD_STEPS.map((s) => (
            <div key={s.id} className={cn('flex items-center shrink-0', s.id < WIZARD_STEPS.length && 'flex-1')}>
              <button type="button" onClick={() => s.id <= step && setStep(s.id)} className={cn('flex flex-col items-center gap-1 px-2', s.id <= step ? 'cursor-pointer' : 'opacity-40')}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', step === s.id ? 'bg-sky-600 text-white ring-4 ring-sky-500/20' : s.id < step ? 'bg-emerald-500 text-white' : 'bg-surface-elevated text-content-muted')}>{s.id}</div>
                <span className={cn('text-[9px] font-medium hidden sm:block', step === s.id && 'text-sky-600')}>{s.title}</span>
              </button>
              {s.id < WIZARD_STEPS.length && <div className={cn('h-0.5 flex-1 mx-1 min-w-[12px]', s.id < step ? 'bg-emerald-500' : 'bg-surface-elevated')} />}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-subtle bg-surface shadow-lg p-6 sm:p-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">Select Lead</h2>
                  {state.leadId && config.leadViewPath && (
                    <Link
                      to={config.leadViewPath(state.leadId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      View Lead <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                {selectedLead && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm">
                    <p className="font-semibold text-content-primary">{selectedLead.name}</p>
                    <p className="text-xs text-content-muted mt-0.5">{selectedLead.destination} · {formatINR(selectedLead.budget)}</p>
                  </div>
                )}
                <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                  {leads.map((l) => (
                    <button
                      key={l._id}
                      type="button"
                      onClick={() => selectLead(l)}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                        state.leadId === l._id
                          ? 'border-sky-500/50 bg-sky-500/10 ring-2 ring-sky-500/20'
                          : 'border-subtle hover:bg-surface-elevated'
                      )}
                    >
                      <Avatar name={l.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{l.name}</p>
                        <p className="text-xs text-content-muted">{l.destination} · {formatINR(l.budget)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">Select Package</h2>
                <p className="text-xs text-content-muted">
                  Packages for <span className="font-medium text-content-primary">{selectedLead?.destination || 'selected lead'}</span> from Uno Hotels
                </p>
                {loadingPackages ? (
                  <p className="text-sm text-content-muted py-8 text-center">Loading packages...</p>
                ) : (
                <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                  {packages.length === 0 ? (
                    <p className="text-sm text-content-muted col-span-full py-8 text-center">No packages found for this destination.</p>
                  ) : packages.map((p) => (
                    <button key={p._id} type="button" onClick={() => selectPackage(p)} className={cn('p-4 rounded-xl border text-left', state.packageId === p._id ? 'border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20' : 'border-subtle hover:bg-surface-elevated')}>
                      <p className="font-bold">{p.name}</p>
                      <p className="text-xs text-content-muted mt-1">{p.destination} · {p.durationLabel || `${p.duration}D`} · from {formatINR(p.startingPrice)}</p>
                    </button>
                  ))}
                </div>
                )}
                {loadingPackageDetail && (
                  <p className="text-xs text-amber-700">Loading package itinerary...</p>
                )}
              </div>
            )}
            {step === 3 && activePkg && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Customize Package</h2>
                <textarea value={state.customizations} onChange={(e) => setState({ ...state, customizations: e.target.value })} rows={3} placeholder="Special requests, inclusions, exclusions..." className="input-premium w-full rounded-xl resize-none" />
                <ItineraryBuilder itinerary={customItinerary} onChange={setCustomItinerary} destination={activePkg.destination} />
              </div>
            )}
            {step === 4 && (
              <UnoHotelSelector
                destination={hotelDestination}
                value={unoHotelSelection}
                onChange={setUnoHotelSelection}
                nights={packageNights}
              />
            )}
            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Add Transport</h2>
                <p className="text-sm font-medium text-content-muted">Cabs</p>
                {cabs.map((c) => (
                  <button key={c._id} type="button" onClick={() => toggleId('selectedCabIds', c._id)} className={cn('w-full flex justify-between p-3 rounded-xl border text-left', state.selectedCabIds.includes(c._id) ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-subtle')}>
                    <span className="text-sm">{c.vehicleType} · {c.pickupLocation} → {c.dropLocation}</span>
                    <span className="font-bold text-sm">{formatINR(c.cost)}</span>
                  </button>
                ))}
                <p className="text-sm font-medium text-content-muted pt-2">Flights</p>
                {flights.map((f) => (
                  <button key={f._id} type="button" onClick={() => toggleId('selectedFlightIds', f._id)} className={cn('w-full flex justify-between p-3 rounded-xl border text-left', state.selectedFlightIds.includes(f._id) ? 'border-sky-500/50 bg-sky-500/10' : 'border-subtle')}>
                    <span className="text-sm">{f.airline} {f.flightNumber}</span>
                    <span className="font-bold text-sm">{formatINR(f.cost)}</span>
                  </button>
                ))}
              </div>
            )}
            {step === 6 && (
              <div className="space-y-3">
                <h2 className="text-lg font-bold">Add Activities</h2>
                {activities.map((a) => (
                  <button key={a._id} type="button" onClick={() => toggleId('selectedActivityIds', a._id)} className={cn('w-full flex justify-between p-3 rounded-xl border text-left', state.selectedActivityIds.includes(a._id) ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-subtle')}>
                    <span className="text-sm">{a.name} {a.destination ? `· ${a.destination}` : ''}</span>
                    <span className="font-bold text-sm">{formatINR(a.price)}</span>
                  </button>
                ))}
              </div>
            )}
            {step === 7 && <div><h2 className="text-lg font-bold mb-4">Pricing</h2><QuotePricingPanel pricing={state.pricing} onChange={(p) => setState({ ...state, pricing: p })} /></div>}
            {step === 8 && draftQuote && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">Generate Quote</h2>
                <div className="rounded-xl border border-subtle overflow-hidden max-h-[500px] overflow-y-auto bg-white">
                  <QuotePdfPreview quote={draftQuote} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8 pt-6 border-t border-subtle">
          <Button type="button" variant="outline" className="rounded-xl gap-2" disabled={step === 1} onClick={() => setStep((s) => s - 1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
          {step < 8 ? (
            <Button type="button" variant="sky" className="rounded-xl gap-2" onClick={() => setStep((s) => s + 1)} disabled={(step === 1 && !state.leadId) || (step === 2 && (!state.packageId || loadingPackageDetail)) || (step === 4 && !unoHotelSelection?.mealPlan)}>Continue <ArrowRight className="w-4 h-4" /></Button>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="rounded-xl gap-2" disabled={saving} onClick={() => handleSave('draft')}><Save className="w-4 h-4" /> {config.draftLabel}</Button>
              <Button type="button" variant="emerald" className="rounded-xl gap-2" disabled={saving} onClick={() => handleSave('submit')}><FileText className="w-4 h-4" /> {config.submitLabel}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
