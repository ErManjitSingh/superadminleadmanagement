import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api/axios';
import { calculatePackagePricing, defaultPackageState, packageFromApi, packageToPayload } from './packageBuilderUtils';
import { PACKAGE_BUILDER_STEPS } from './packageBuilderConstants';
import { defaultBuilderUi } from '../../builder-shared/builderUiUtils';

export function usePackageBuilder(packageId) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [state, setState] = useState(() => defaultPackageState());
  const [cabs, setCabs] = useState([]);
  const [catalogHotels, setCatalogHotels] = useState([]);
  const [catalogVendors, setCatalogVendors] = useState([]);
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
    Promise.allSettled([
      API.get('/cabs', { skipSuccessToast: true, skipErrorToast: true }),
      API.get('/hotels', { skipSuccessToast: true, skipErrorToast: true }),
      API.get('/vendors', { params: { status: 'active' }, skipSuccessToast: true, skipErrorToast: true }),
    ]).then((results) => {
      const pick = (i) => {
        if (results[i].status !== 'fulfilled') return [];
        const data = results[i].value.data;
        return Array.isArray(data) ? data : data?.data || [];
      };
      setCabs(pick(0));
      setCatalogHotels(pick(1));
      setCatalogVendors(pick(2));
    });
  }, []);

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

  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const updateBuilderUi = useCallback((patch) => {
    setState((s) => ({
      ...s,
      builderUi: { ...(s.builderUi || defaultBuilderUi()), ...patch },
    }));
  }, []);

  const updatePricing = useCallback((finalPrice) => {
    setState((s) => ({
      ...s,
      pricing: calculatePackagePricing({ ...s.pricing, finalPrice }),
      startingPrice: finalPrice,
    }));
  }, []);

  const setItinerary = useCallback((itinerary) => update({ itinerary }), [update]);

  const setDestinations = useCallback((destinations) => update({ destinations }), [update]);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(state.name?.trim() && state.destination?.trim() && state.duration >= 1);
    if (step === 2) return (state.itinerary || []).length > 0;
    return true;
  }, [step, state.name, state.destination, state.duration, state.itinerary]);

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
        await API.post(`/packages/${saved._id}/publish`, { status });
        navigate('/packages', { state: { message: status === 'published' ? 'Package published!' : 'Package saved.' } });
        return saved;
      } catch {
        navigate('/packages', { state: { message: 'Package saved.' } });
        return saved;
      }
    }
    return saved;
  }, [save, navigate]);

  return {
    step,
    setStep,
    maxReached,
    totalSteps,
    state,
    builderUi: state.builderUi || defaultBuilderUi(),
    cabs,
    catalogHotels,
    setCatalogHotels,
    catalogVendors,
    setCatalogVendors,
    update,
    updateBuilderUi,
    updatePricing,
    setItinerary,
    setDestinations,
    canContinue,
    loading,
    saving,
    autosaveStatus,
    error,
    draftPreview,
    versions,
    save,
    publish,
    isEdit: Boolean(packageId),
  };
}
