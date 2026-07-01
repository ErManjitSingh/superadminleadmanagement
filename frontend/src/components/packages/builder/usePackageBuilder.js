import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api/axios';
import { calculatePackagePricing, defaultPackageState, packageFromApi, packageToPayload } from './packageBuilderUtils';
import { PACKAGE_BUILDER_STEPS } from './packageBuilderConstants';
import { cleanInclusionExclusionLines } from '../../quotations/InclusionExclusionEditor';

export function usePackageBuilder(packageId) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [state, setState] = useState(() => defaultPackageState());
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(Boolean(packageId));
  const [saving, setSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState('idle');
  const [error, setError] = useState('');

  const totalSteps = PACKAGE_BUILDER_STEPS.length;

  useEffect(() => {
    setMaxReached((m) => Math.max(m, step));
  }, [step]);

  useEffect(() => {
    if (!packageId) return;
    setLoading(true);
    API.get(`/packages/${packageId}`)
      .then((res) => {
        setState(packageFromApi(res.data));
        setVersions(res.data.versions || []);
      })
      .catch(() => setError('Could not load package'))
      .finally(() => setLoading(false));
  }, [packageId]);

  useEffect(() => {
    const pricing = calculatePackagePricing(state.pricing, 2);
    setState((s) => ({
      ...s,
      pricing,
      startingPrice: pricing.finalPrice,
    }));
  }, [
    state.pricing.hotelCost,
    state.pricing.cabCost,
    state.pricing.activityCost,
    state.pricing.mealCost,
    state.pricing.guideCost,
    state.pricing.taxes,
    state.pricing.markup,
    state.pricing.discount,
    state.pricing.agentCommission,
  ]);

  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const updatePricing = useCallback((patch) => {
    setState((s) => ({ ...s, pricing: { ...s.pricing, ...patch } }));
  }, []);

  const updateNested = useCallback((key, patch) => {
    setState((s) => ({ ...s, [key]: { ...s[key], ...patch } }));
  }, []);

  const setItinerary = useCallback((itinerary) => update({ itinerary }), [update]);
  const setDestinations = useCallback((destinations) => update({ destinations }), [update]);
  const setInclusions = useCallback((inclusions) => update({ inclusions }), [update]);
  const setExclusions = useCallback((exclusions) => update({ exclusions }), [update]);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(state.name?.trim() && state.destination?.trim() && state.duration >= 1);
    return true;
  }, [step, state.name, state.destination, state.duration]);

  const draftPreview = useMemo(() => packageToPayload(state), [state]);

  const save = useCallback(async (statusOverride) => {
    if (!state.name?.trim()) {
      setError('Package name is required');
      setStep(1);
      return null;
    }
    setSaving(true);
    setAutosaveStatus('saving');
    setError('');
    try {
      const payload = packageToPayload({
        ...state,
        status: statusOverride || state.status,
      });
      let res;
      if (packageId) {
        res = await API.put(`/packages/${packageId}`, payload);
      } else {
        res = await API.post('/packages', payload);
      }
      setState(packageFromApi(res.data));
      setAutosaveStatus('saved');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
      setAutosaveStatus('error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [state, packageId]);

  const publish = useCallback(async (status = 'published') => {
    const saved = await save(status);
    if (!saved) return null;
    if (saved._id) {
      try {
        const res = await API.post(`/packages/${saved._id}/publish`, { status });
        navigate('/packages', { state: { message: status === 'published' ? 'Package published!' : 'Package saved.' } });
        return res.data;
      } catch {
        navigate('/packages', { state: { message: 'Package saved.' } });
        return saved;
      }
    }
    return saved;
  }, [save, navigate]);

  const saveVersion = useCallback(async () => {
    if (!packageId) {
      const saved = await save();
      if (!saved?._id) return;
      await API.post(`/packages/${saved._id}/versions`, { label: `Version ${new Date().toLocaleString()}` });
      return;
    }
    const res = await API.post(`/packages/${packageId}/versions`, { label: `Version ${new Date().toLocaleString()}` });
    setVersions(res.data.versions || []);
  }, [packageId, save]);

  const restoreVersion = useCallback(async (versionId) => {
    if (!packageId) return;
    const res = await API.post(`/packages/${packageId}/versions/${versionId}/restore`);
    setState(packageFromApi(res.data));
    setVersions(res.data.versions || []);
  }, [packageId]);

  const toggleTag = useCallback((tag) => {
    setState((s) => ({
      ...s,
      tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag],
    }));
  }, []);

  const toggleFeature = useCallback((key) => {
    setState((s) => ({
      ...s,
      features: { ...s.features, [key]: !s.features[key] },
    }));
  }, []);

  const toggleInclusionPreset = useCallback((text) => {
    setState((s) => {
      const active = cleanInclusionExclusionLines(s.inclusions);
      const next = active.includes(text) ? active.filter((x) => x !== text) : [...active, text];
      return { ...s, inclusions: next.length ? next : [''] };
    });
  }, []);

  const toggleExclusionPreset = useCallback((text) => {
    setState((s) => {
      const active = cleanInclusionExclusionLines(s.exclusions);
      const next = active.includes(text) ? active.filter((x) => x !== text) : [...active, text];
      return { ...s, exclusions: next.length ? next : [''] };
    });
  }, []);

  return {
    step,
    setStep,
    maxReached,
    totalSteps,
    state,
    update,
    updatePricing,
    updateNested,
    setItinerary,
    setDestinations,
    setInclusions,
    setExclusions,
    canContinue,
    loading,
    saving,
    autosaveStatus,
    error,
    draftPreview,
    versions,
    save,
    publish,
    saveVersion,
    restoreVersion,
    toggleTag,
    toggleFeature,
    toggleInclusionPreset,
    toggleExclusionPreset,
    isEdit: Boolean(packageId),
  };
}
