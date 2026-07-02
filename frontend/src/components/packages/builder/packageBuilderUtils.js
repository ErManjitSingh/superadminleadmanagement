import { defaultItineraryDay } from '../../quotations/quotationUtils';
import {
  defaultBuilderUi,
  builderUiToHotels,
  builderUiToTransport,
  builderUiFromPackage,
} from '../../builder-shared/builderUiUtils';

export function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const defaultPricing = {
  hotelCost: 0,
  cabCost: 0,
  activityCost: 0,
  mealCost: 0,
  guideCost: 0,
  taxes: 0,
  markup: 0,
  discount: 0,
  agentCommission: 0,
  finalPrice: 0,
  perPerson: 0,
  doubleSharing: 0,
  tripleSharing: 0,
  quadSharing: 0,
  childWithBed: 0,
  childWithoutBed: 0,
  infant: 0,
};

export function calculatePackagePricing(pricing = {}, adults = 2) {
  const finalPrice = Math.max(0, Number(pricing.finalPrice) || 0);
  const perPerson = adults > 0 ? Math.round(finalPrice / adults) : finalPrice;
  return {
    ...defaultPricing,
    ...pricing,
    finalPrice,
    perPerson,
    cabCost: pricing.cabCost || 0,
    hotelCost: pricing.hotelCost || 0,
  };
}

export function defaultPackageState(destination = 'Himachal Pradesh') {
  const days = 4;
  const nights = 3;
  return {
    name: '',
    slug: '',
    destination,
    state: 'Himachal Pradesh',
    country: 'India',
    duration: days,
    days,
    nights,
    startingCity: '',
    endingCity: '',
    bestTime: 'March – June, September – November',
    difficulty: '',
    packageCode: '',
    shortDescription: '',
    longDescription: '',
    coverImage: '',
    startingPrice: 0,
    packageType: 'family',
    status: 'draft',
    destinations: [],
    itinerary: Array.from({ length: days }, (_, i) => defaultItineraryDay(i + 1, destination)),
    hotels: [],
    transport: [],
    activities: [],
    meals: [],
    pricing: { ...defaultPricing },
    inclusions: ['Hotel accommodation', 'Private cab', 'Breakfast & Dinner'],
    exclusions: ['Personal expenses', 'Lunch', 'Entry tickets'],
    cancellationPolicy: { content: '', refundRules: '', slabs: [] },
    importantNotes: {
      travelGuidelines: '',
      documentsRequired: 'Valid ID proof',
      packingTips: '',
      weather: '',
      safety: '',
    },
    gallery: [],
    videos: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
    tags: [],
    features: {
      refundable: false,
      privateCab: true,
      guideIncluded: false,
      breakfast: true,
      dinner: true,
      flights: false,
      visa: false,
      insurance: false,
    },
    builderUi: defaultBuilderUi(),
  };
}

export function packageFromApi(pkg = {}) {
  const destination = pkg.destination || 'Himachal Pradesh';
  const days = pkg.days || pkg.duration || 4;
  const base = defaultPackageState(destination);
  const builderUi = builderUiFromPackage(pkg);

  return {
    ...base,
    ...pkg,
    itinerary: (pkg.itinerary?.length ? pkg.itinerary : base.itinerary).map((d, i) => ({
      ...defaultItineraryDay(d.day || i + 1, destination),
      ...d,
      id: d._id || d.id || `day-${i}`,
    })),
    inclusions: pkg.inclusions?.length ? pkg.inclusions : base.inclusions,
    exclusions: pkg.exclusions?.length ? pkg.exclusions : base.exclusions,
    meals: pkg.meals || [],
    pricing: { ...defaultPricing, ...(pkg.pricing || {}) },
    cancellationPolicy: { content: '', refundRules: '', slabs: [], ...(pkg.cancellationPolicy || {}) },
    importantNotes: { ...base.importantNotes, ...(pkg.importantNotes || {}) },
    seo: { ...base.seo, ...(pkg.seo || {}) },
    features: { ...base.features, ...(pkg.features || {}) },
    destinations: pkg.destinations || [],
    hotels: pkg.hotels || [],
    transport: pkg.transport || [],
    activities: [],
    gallery: pkg.gallery || [],
    videos: pkg.videos || [],
    tags: pkg.tags || [],
    builderUi: {
      ...defaultBuilderUi(),
      ...builderUi,
      internalNotes:
        builderUi.internalNotes ||
        (typeof pkg.importantNotes === 'string' ? pkg.importantNotes : pkg.importantNotes?.travelGuidelines || ''),
      aiPrompt: pkg.aiPrompt || builderUi.aiPrompt || '',
    },
  };
}

export function packageToPayload(state) {
  const builderUi = state.builderUi || defaultBuilderUi();
  const hotels = builderUiToHotels(builderUi, state.destinations);
  const transport = builderUiToTransport(builderUi);
  const cabCost = transport.reduce((s, t) => s + (Number(t.cost) || 0), 0);
  const finalPrice = Math.max(0, Number(state.pricing?.finalPrice) || 0);

  const pricing = calculatePackagePricing({
    ...state.pricing,
    finalPrice,
    cabCost,
    hotelCost: 0,
    activityCost: 0,
    mealCost: 0,
    guideCost: 0,
    taxes: 0,
    markup: 0,
    discount: 0,
    agentCommission: 0,
  });

  const notes = builderUi.internalNotes?.trim()
    ? { ...state.importantNotes, travelGuidelines: builderUi.internalNotes }
    : state.importantNotes;

  return {
    ...state,
    slug: state.slug || slugify(state.name),
    days: state.days || state.duration,
    nights: state.nights ?? Math.max(0, (state.days || state.duration) - 1),
    duration: state.days || state.duration,
    startingPrice: pricing.finalPrice || state.startingPrice || 0,
    pricing,
    hotels,
    transport,
    activities: [],
    meals: state.meals || [],
    importantNotes: notes,
    inclusions: (state.inclusions || []).filter((x) => String(x).trim()),
    exclusions: (state.exclusions || []).filter((x) => String(x).trim()),
    itinerary: (state.itinerary || []).map(({ id, ...rest }) => rest),
    builderUi: undefined,
  };
}

export function normalizePackageForQuotation(pkg) {
  return {
    _id: pkg._id,
    name: pkg.name,
    destination: pkg.destination,
    duration: pkg.days || pkg.duration,
    startingPrice: pkg.pricing?.finalPrice || pkg.startingPrice || 0,
    coverImage: pkg.coverImage || pkg.gallery?.[0] || '',
    itinerary: pkg.itinerary || [],
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    importantNotes: pkg.importantNotes,
    hotels: pkg.hotels,
    transport: pkg.transport,
    activities: [],
    source: 'local',
  };
}
