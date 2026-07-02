import { useCallback, useEffect, useMemo, useState } from 'react';
import API from '../../../api/axios';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { buildListParams, unwrapList, unwrapPagination } from '../../../utils/apiHelpers';
import { parsePackageNights } from '../UnoHotelSelector';
import { cleanInclusionExclusionLines } from '../InclusionExclusionEditor';
import { isNoHotelMealPlan } from '../constants';
import {
  defaultItineraryDay,
  defaultWizardState,
  DEFAULT_PAYMENT_PLAN,
  matchesResourceDestination,
} from '../quotationUtils';
import { normalizePackageForQuotation } from '../../packages/builder/packageBuilderUtils';
import {
  defaultBuilderUi,
  builderUiFromPackage,
  builderUiToSelectedHotelsSnapshot,
  builderUiToSelectedCabs,
} from '../../builder-shared/builderUiUtils';

export const BUILDER_CONFIG = {
  executive: {
    leadsPath: '/sales-executive/leads/all',
    leadApiPath: (id) => `/sales-executive/leads/${id}`,
    leadDetailPath: (id) => `/sales-executive/leads/${id}/view`,
    contactEndpoint: '/sales-executive/leads',
    savePath: '/sales-executive/quotations',
    backPath: '/sales-executive/quotations',
    successPath: '/sales-executive/quotations',
    draftStatus: 'draft',
    submitStatus: 'pending_approval',
    draftLabel: 'Save Draft',
    submitLabel: 'Submit Quotation',
    approvalNote:
      'The first quotation for a lead is approved automatically. From the second quote onward, Team Leader approval is required.',
  },
  team_leader: {
    leadsPath: '/team-leader/leads',
    leadApiPath: (id) => `/team-leader/leads/${id}`,
    leadDetailPath: (id) => `/team-leader/leads/${id}/view`,
    leadsParams: { filter: 'all', page: 1, limit: 50 },
    savePath: '/team-leader/quotations',
    backPath: '/team-leader/quotations/pending',
    successPath: '/team-leader/quotations/approved',
    draftStatus: 'draft',
    submitStatus: 'approved',
    draftLabel: 'Save Draft',
    submitLabel: 'Create & Approve',
    approvalNote: 'Executive can send the approved quote to the customer.',
  },
  sales_manager: {
    leadsPath: '/sales-manager/leads',
    leadApiPath: (id) => `/sales-manager/leads/${id}`,
    leadDetailPath: (id) => `/sales-manager/leads/${id}/view`,
    leadsParams: { filter: 'all', page: 1, limit: 50 },
    savePath: '/sales-manager/quotations',
    backPath: '/sales-manager/quotations/pending',
    successPath: '/sales-manager/quotations/approved',
    draftStatus: 'draft',
    submitStatus: 'approved',
    draftLabel: 'Save Draft',
    submitLabel: 'Create & Approve',
    approvalNote: 'Quote is approved on creation. Executive can send to customer.',
  },
  admin: {
    leadsPath: '/leads',
    leadApiPath: (id) => `/leads/${id}`,
    leadDetailPath: (id) => `/leads/${id}`,
    contactEndpoint: '/leads',
    savePath: '/quotations',
    backPath: '/quotations',
    successPath: '/quotations',
    title: 'Quotation Builder',
    subtitle: 'Create quotations for any lead — view all team quotes from the quotations list',
    draftStatus: 'draft',
    submitStatus: 'sent',
    draftLabel: 'Save Draft',
    submitLabel: 'Save & Mark Sent',
    approvalNote: null,
  },
};

function buildFallbackItinerary(detail) {
  const days = Math.max(1, Number(detail.duration) || 1);
  const destination = detail.destination || 'Destination';
  return Array.from({ length: days }, (_, index) => defaultItineraryDay(index + 1, destination));
}

function syncPaymentAmounts(plan, total) {
  const amount = Number(total) || 0;
  return plan.map((row) => ({
    ...row,
    amount: Math.round((amount * (Number(row.percent) || 0)) / 100),
  }));
}

export function useQuotationBuilder({ mode = 'executive', initialLeadId = '' }) {
  const config = BUILDER_CONFIG[mode] || BUILDER_CONFIG.executive;

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [draftId, setDraftId] = useState(null);
  const [autosaveStatus, setAutosaveStatus] = useState('idle');
  const [versions, setVersions] = useState([]);
  const [shareToken, setShareToken] = useState('');

  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadSearch, setLeadSearch] = useState('');
  const debouncedLeadSearch = useDebouncedValue(leadSearch, 400);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingLead, setLoadingLead] = useState(Boolean(initialLeadId));
  const [leadLoadError, setLeadLoadError] = useState('');

  const [templates, setTemplates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [flights, setFlights] = useState([]);
  const [activities, setActivities] = useState([]);

  const [state, setState] = useState({ ...defaultWizardState, leadId: initialLeadId || '' });
  const [builderUi, setBuilderUi] = useState(defaultBuilderUi());
  const [customItinerary, setCustomItinerary] = useState([]);
  const [customInclusions, setCustomInclusions] = useState(['']);
  const [customExclusions, setCustomExclusions] = useState(['']);
  const [selectedPkgDetail, setSelectedPkgDetail] = useState(null);
  const [dayWiseHotels, setDayWiseHotels] = useState([]);
  const [loadingPackageDetail, setLoadingPackageDetail] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveRevision, setSaveRevision] = useState(0);
  const debouncedRevision = useDebouncedValue(saveRevision, 2000);

  const selectedPkg = packages.find((p) => p._id === state.packageId);
  const activePkg = selectedPkgDetail || selectedPkg;
  const packageNights = parsePackageNights(activePkg);
  const hotelDestination =
    state.packageInfo?.destination || selectedLead?.destination || activePkg?.destination || '';
  const availableActivities = activities.filter((a) => matchesResourceDestination(a, hotelDestination));

  const buildPackageSnapshot = useCallback(
    (pkg) => ({
      ...pkg,
      name: state.packageInfo?.packageName || pkg?.name,
      destination: state.packageInfo?.destination || pkg?.destination,
      duration: state.packageInfo?.duration || pkg?.duration,
      coverImage: pkg?.coverImage || state.packageInfo?.coverImage,
      itinerary: customItinerary,
      inclusions: cleanInclusionExclusionLines(customInclusions),
      exclusions: cleanInclusionExclusionLines(customExclusions),
      importantNotes: state.importantNotes,
      paymentPlan: state.paymentPlan,
    }),
    [customItinerary, customInclusions, customExclusions, state.packageInfo, state.importantNotes, state.paymentPlan]
  );

  const buildSavePayload = useCallback(
    (statusOverride) => {
      const total = Number(state.pricing.total) || Number(state.pricing.grandTotal) || 0;
      const destList = hotelDestination ? [{ name: hotelDestination }] : [];
      return {
        leadId: state.leadId,
        packageId: state.packageId,
        status: statusOverride,
        pricing: {
          ...state.pricing,
          total,
          grandTotal: total,
          baseCost: total,
        },
        packageInfo: state.packageInfo,
        paymentPlan: syncPaymentAmounts(state.paymentPlan, total),
        importantNotes: {
          ...state.importantNotes,
          travelGuidelines: builderUi.internalNotes || state.importantNotes.travelGuidelines,
        },
        templateKey: state.templateKey,
        selectedHotels: builderUiToSelectedHotelsSnapshot(builderUi, destList),
        selectedCabs: builderUiToSelectedCabs(builderUi),
        selectedFlights: [],
        selectedActivities: [],
        package: buildPackageSnapshot(activePkg),
        customizations: state.customizations,
      };
    },
    [state, builderUi, activePkg, buildPackageSnapshot, hotelDestination]
  );

  const draftQuote = useMemo(() => {
    if (!selectedLead) return null;
    const total = Number(state.pricing.total) || Number(state.pricing.grandTotal) || 0;
    const destList = hotelDestination ? [{ name: hotelDestination }] : [];
    return {
      quoteNumber: draftId ? 'DRAFT' : 'PREVIEW',
      createdAt: new Date().toISOString(),
      lead: selectedLead,
      package: buildPackageSnapshot(activePkg || {}),
      pricing: { ...state.pricing, total, grandTotal: total },
      packageInfo: state.packageInfo,
      paymentPlan: syncPaymentAmounts(state.paymentPlan, total),
      importantNotes: state.importantNotes,
      selectedHotels: builderUiToSelectedHotelsSnapshot(builderUi, destList),
      selectedCabs: builderUiToSelectedCabs(builderUi),
      selectedActivities: [],
    };
  }, [selectedLead, activePkg, state, builderUi, buildPackageSnapshot, draftId, hotelDestination]);

  useEffect(() => {
    if (step > maxReached) setMaxReached(step);
  }, [step, maxReached]);

  useEffect(() => {
    const skipHotel = isNoHotelMealPlan(state.packageInfo?.mealPlan);
    setBuilderUi((ui) => (ui.skipHotel === skipHotel ? ui : { ...ui, skipHotel }));
  }, [state.packageInfo?.mealPlan]);

  useEffect(() => {
    API.get(`${config.savePath}/templates`, { skipErrorToast: true })
      .then((res) => setTemplates(Array.isArray(res.data) ? res.data : []))
      .catch(() => setTemplates([]));
  }, [config.savePath]);

  useEffect(() => {
    Promise.allSettled([
      API.get('/cabs', { skipErrorToast: true }),
      API.get('/flights', { skipErrorToast: true }),
      API.get('/activities', { skipErrorToast: true }),
    ]).then((results) => {
      const pick = (i) => (results[i].status === 'fulfilled' ? unwrapList(results[i].value.data) : []);
      setCabs(pick(0));
      setFlights(pick(1));
      setActivities(pick(2));
    });
  }, []);

  const fetchLeadById = useCallback(
    async (id) => {
      if (!id) return null;
      setLoadingLead(true);
      setLeadLoadError('');
      try {
        const apiPath = config.leadApiPath?.(id) || config.leadDetailPath(id);
        const { data } = await API.get(apiPath, { skipErrorToast: true });
        const lead = data?.lead || data;
        if (!lead?._id && !lead?.name) {
          throw new Error('Invalid lead response');
        }
        setSelectedLead(lead);
        setState((s) => ({
          ...s,
          leadId: id,
          packageInfo: {
            ...s.packageInfo,
            destination: lead.destination || s.packageInfo.destination,
          },
        }));
        return lead;
      } catch {
        setSelectedLead(null);
        setLeadLoadError('Could not load this lead. Open the quotation builder again from the lead page.');
        return null;
      } finally {
        setLoadingLead(false);
      }
    },
    [config]
  );

  const fetchLeads = useCallback(
    async (searchTerm) => {
      setLoadingLeads(true);
      try {
        const baseParams = config.leadsParams || { page: 1, limit: 50 };
        const params = buildListParams({
          page: 1,
          limit: 50,
          filters: { ...baseParams, search: searchTerm?.trim() || undefined },
        });
        const { data } = await API.get(config.leadsPath, { params, skipErrorToast: true });
        const rows = unwrapPagination(data).data || unwrapList(data);
        setLeads(rows);
        return rows;
      } catch {
        setLeads([]);
        return [];
      } finally {
        setLoadingLeads(false);
      }
    },
    [config]
  );

  useEffect(() => {
    if (initialLeadId) fetchLeadById(initialLeadId);
  }, [initialLeadId, fetchLeadById]);

  useEffect(() => {
    if (debouncedLeadSearch.trim().length >= 2) fetchLeads(debouncedLeadSearch);
  }, [debouncedLeadSearch, fetchLeads]);

  useEffect(() => {
    const destination = hotelDestination;
    if (!destination) {
      setPackages([]);
      return undefined;
    }
    let cancelled = false;
    setLoadingPackages(true);
    Promise.all([
      API.get('/packages', { params: { search: destination }, skipErrorToast: true }).catch(() => ({ data: [] })),
      API.get('/uno-packages', { params: { limit: 50, destination }, skipErrorToast: true }).catch(() => ({ data: [] })),
    ])
      .then(([localRes, unoRes]) => {
        if (cancelled) return;
        const local = (Array.isArray(localRes.data) ? localRes.data : [])
          .filter((p) => ['published', 'hidden', 'draft'].includes(p.status) || !p.status)
          .map((p) => ({
            ...normalizePackageForQuotation(p),
            _catalog: 'local',
            source: 'local',
          }));
        const uno = unwrapList(unoRes.data).map((p) => ({ ...p, _catalog: 'uno', source: 'uno' }));
        setPackages([...local, ...uno]);
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
  }, [hotelDestination]);

  useEffect(() => {
    const total = Number(state.pricing.total) || 0;
    setState((s) => ({
      ...s,
      pricing: {
        ...s.pricing,
        total,
        grandTotal: total,
        baseCost: total,
      },
      paymentPlan: syncPaymentAmounts(s.paymentPlan, total),
    }));
  }, [state.pricing.total]);

  useEffect(() => {
    if (!state.leadId || !state.packageId) return;
    setSaveRevision((r) => r + 1);
  }, [
    state.leadId,
    state.packageId,
    state.packageInfo,
    state.pricing,
    state.paymentPlan,
    state.importantNotes,
    state.templateKey,
    state.customizations,
    state.selectedCabIds,
    state.selectedFlightIds,
    state.selectedActivityIds,
    customItinerary,
    customInclusions,
    customExclusions,
    dayWiseHotels,
    builderUi,
  ]);

  useEffect(() => {
    if (!state.leadId || !state.packageId || debouncedRevision === 0) return;

    let cancelled = false;
    setAutosaveStatus('saving');
    const payload = buildSavePayload('draft');
    const url = draftId ? `${config.savePath}/${draftId}/autosave` : `${config.savePath}/autosave`;

    API.post(url, payload, { skipErrorToast: true })
      .then((res) => {
        if (cancelled) return;
        setDraftId(res.data._id);
        setShareToken(res.data.shareToken || '');
        setVersions(res.data.versions || []);
        setAutosaveStatus('saved');
      })
      .catch(() => {
        if (!cancelled) setAutosaveStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedRevision, state.leadId, state.packageId, draftId, config.savePath, buildSavePayload]);

  const selectLead = (lead) => {
    setSelectedLead(lead);
    setState((s) => ({
      ...defaultWizardState,
      leadId: lead._id,
      packageInfo: { ...s.packageInfo, destination: lead.destination || '' },
    }));
    setSelectedPkgDetail(null);
    setCustomItinerary([]);
    setCustomInclusions(['']);
    setCustomExclusions(['']);
    setDayWiseHotels([]);
    setBuilderUi(defaultBuilderUi());
  };

  const applyPackageDetail = (detail) => {
    const itinerary = detail.itinerary?.length > 0 ? detail.itinerary : buildFallbackItinerary(detail);
    const normalized = { ...detail, itinerary };
    setSelectedPkgDetail(normalized);
    setCustomItinerary(itinerary.map((d) => ({ ...d, id: d.id || d._id || `day-${Date.now()}-${d.day}` })));
    setCustomInclusions(normalized.inclusions?.length ? [...normalized.inclusions] : ['']);
    setCustomExclusions(normalized.exclusions?.length ? [...normalized.exclusions] : ['']);
    setBuilderUi(builderUiFromPackage(normalized));
    const packageTotal = Number(detail.pricing?.finalPrice) || Number(normalized.startingPrice) || 0;
    setState((s) => ({
      ...s,
      packageInfo: {
        ...s.packageInfo,
        packageName: normalized.name || s.packageInfo.packageName,
        destination: normalized.destination || s.packageInfo.destination,
        duration: normalized.duration || s.packageInfo.duration,
        coverImage: normalized.coverImage,
      },
      importantNotes: detail.importantNotes
        ? {
            ...s.importantNotes,
            cancellationPolicy: detail.cancellationPolicy?.content || detail.importantNotes?.travelGuidelines || s.importantNotes.cancellationPolicy,
            termsAndConditions: detail.cancellationPolicy?.refundRules || s.importantNotes.termsAndConditions,
            travelGuidelines: detail.importantNotes.travelGuidelines || s.importantNotes.travelGuidelines,
            documentsRequired: detail.importantNotes.documentsRequired || s.importantNotes.documentsRequired,
          }
        : s.importantNotes,
      pricing: {
        ...s.pricing,
        total: packageTotal,
        grandTotal: packageTotal,
        baseCost: packageTotal,
      },
      paymentPlan: syncPaymentAmounts(s.paymentPlan, packageTotal),
    }));
  };

  const selectPackage = async (pkg) => {
    setState((s) => ({ ...s, packageId: pkg._id, templateKey: '' }));
    setLoadingPackageDetail(true);
    try {
      if (pkg._catalog === 'local' || pkg.source === 'local') {
        const res = await API.get(`/packages/${pkg._id}`, { skipErrorToast: true });
        const detail = normalizePackageForQuotation(res.data);
        applyPackageDetail({
          ...detail,
          inclusions: res.data.inclusions,
          exclusions: res.data.exclusions,
          importantNotes: res.data.importantNotes,
        });
        if (res.data.pricing) {
          const total = res.data.pricing.finalPrice || res.data.startingPrice || 0;
          setState((s) => ({
            ...s,
            pricing: {
              ...s.pricing,
              total,
              grandTotal: total,
              baseCost: total,
            },
            paymentPlan: syncPaymentAmounts(s.paymentPlan, total),
          }));
        }
      } else {
        const res = await API.get(`/uno-packages/${pkg._id}`, { skipErrorToast: true });
        applyPackageDetail(res.data);
      }
    } catch {
      applyPackageDetail(pkg);
    } finally {
      setLoadingPackageDetail(false);
    }
  };

  const applyTemplate = (template) => {
    const itinerary = (template.itinerary || []).map((d, i) => ({
      ...defaultItineraryDay(d.day || i + 1, template.destination),
      ...d,
      id: `day-${template.key}-${i}`,
    }));
    setCustomItinerary(itinerary);
    setCustomInclusions(template.inclusions?.length ? [...template.inclusions] : ['']);
    setCustomExclusions(template.exclusions?.length ? [...template.exclusions] : ['']);
    setState((s) => ({
      ...s,
      templateKey: template.key,
      packageInfo: {
        ...s.packageInfo,
        packageName: template.name,
        destination: template.destination,
        duration: template.duration,
        mealPlan: template.mealPlan,
        hotelCategory: template.hotelCategory,
        transportation: template.transportation,
        coverImage: template.coverImage,
      },
      importantNotes: {
        ...s.importantNotes,
        ...(template.importantNotes || {}),
      },
    }));
    setSelectedPkgDetail({
      name: template.name,
      destination: template.destination,
      duration: template.duration,
      coverImage: template.coverImage,
      itinerary,
      inclusions: template.inclusions,
      exclusions: template.exclusions,
    });
  };

  const toggleId = (key, id) => {
    setState((s) => {
      const arr = s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id];
      const next = { ...s, [key]: arr };
      if (key === 'selectedActivityIds') next.activitiesSkipped = false;
      return next;
    });
  };

  const handleDayWiseHotelChange = (selections) => {
    setDayWiseHotels(selections);
    if (!selections.length || !customItinerary.length) return;
    setCustomItinerary((days) =>
      days.map((day, index) => {
        const dayNum = day.day || index + 1;
        const sel = selections.find((item) => item.day === dayNum);
        if (!sel?.hotel) return day;
        return { ...day, hotel: sel.hotel.name, meals: sel.mealPlan?.label || day.meals };
      })
    );
  };

  const updatePackageInfo = (patch) => {
    setState((s) => ({ ...s, packageInfo: { ...s.packageInfo, ...patch } }));
  };

  const updateImportantNotes = (patch) => {
    setState((s) => ({ ...s, importantNotes: { ...s.importantNotes, ...patch } }));
  };

  const updateBuilderUi = useCallback((patch) => {
    setBuilderUi((ui) => ({ ...ui, ...patch }));
  }, []);

  const updatePricingTotal = useCallback((total) => {
    setState((s) => ({
      ...s,
      pricing: { ...s.pricing, total, grandTotal: total, baseCost: total },
      paymentPlan: syncPaymentAmounts(s.paymentPlan, total),
    }));
  }, []);

  const updatePaymentPlan = (index, patch) => {
    setState((s) => {
      const plan = s.paymentPlan.map((row, i) => (i === index ? { ...row, ...patch } : row));
      const total = s.pricing.grandTotal || s.pricing.total || 0;
      return { ...s, paymentPlan: syncPaymentAmounts(plan, total) };
    });
  };

  const saveVersion = async () => {
    if (!draftId) return;
    const { data } = await API.post(`${config.savePath}/${draftId}/versions`, {
      label: `Version ${(versions?.length || 0) + 1}`,
    });
    setVersions(data.versions || []);
  };

  const restoreVersion = async (versionNumber) => {
    if (!draftId) return;
    const { data } = await API.post(
      `${config.savePath}/${draftId}/versions/${versionNumber}/restore`
    );
    const snap = data.packageSnapshot;
    if (snap?.itinerary) setCustomItinerary(snap.itinerary);
    if (snap?.inclusions) setCustomInclusions(snap.inclusions);
    if (snap?.exclusions) setCustomExclusions(snap.exclusions);
    setState((s) => ({
      ...s,
      packageInfo: data.packageInfo || s.packageInfo,
      paymentPlan: data.paymentPlan || s.paymentPlan,
      importantNotes: data.importantNotes || s.importantNotes,
      pricing: data.pricing || s.pricing,
      templateKey: data.templateKey || s.templateKey,
    }));
    setVersions(data.versions || []);
  };

  const handleSubmit = async (saveAs) => {
    if (!state.leadId || !state.packageId) return;
    const status = saveAs === 'draft' ? config.draftStatus : config.submitStatus;
    setSaving(true);
    try {
      const payload = { ...buildSavePayload(status), quoteNumber: `Q-${Date.now().toString().slice(-6)}` };

      if (draftId) {
        const res = await API.post(`${config.savePath}/${draftId}/autosave`, payload);
        if (saveAs !== 'draft' && mode === 'executive') {
          await API.put(`${config.savePath}/${draftId}`, { action: 'submit' });
        }
        return res.data;
      }

      const res = await API.post(config.savePath, payload);
      return res.data;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    step,
    setStep,
    maxReached,
    draftId,
    autosaveStatus,
    versions,
    shareToken,
    leads,
    selectedLead,
    leadSearch,
    setLeadSearch,
    loadingLeads,
    loadingLead,
    leadLoadError,
    fetchLeads,
    selectLead,
    templates,
    packages,
    loadingPackages,
    loadingPackageDetail,
    selectPackage,
    applyTemplate,
    activePkg,
    packageNights,
    hotelDestination,
    state,
    setState,
    customItinerary,
    setCustomItinerary,
    customInclusions,
    setCustomInclusions,
    customExclusions,
    setCustomExclusions,
    dayWiseHotels,
    handleDayWiseHotelChange,
    builderUi,
    updateBuilderUi,
    updatePricingTotal,
    cabs,
    flights,
    activities,
    availableActivities,
    toggleId,
    updatePackageInfo,
    updateImportantNotes,
    updatePaymentPlan,
    draftQuote,
    saving,
    handleSubmit,
    saveVersion,
    restoreVersion,
    buildPackageSnapshot,
  };
}
