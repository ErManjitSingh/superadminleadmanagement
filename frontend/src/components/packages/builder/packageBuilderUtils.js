import { defaultItineraryDay } from '../../quotations/quotationUtils';

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
  const p = { ...defaultPricing, ...pricing };
  const subtotal =
    Number(p.hotelCost) +
    Number(p.cabCost) +
    Number(p.activityCost) +
    Number(p.mealCost) +
    Number(p.guideCost) +
    Number(p.taxes);
  const beforeCommission = subtotal + Number(p.markup) - Number(p.discount);
  const finalPrice = Math.max(0, beforeCommission);
  const perPerson = adults > 0 ? Math.round(finalPrice / adults) : finalPrice;
  return {
    ...p,
    finalPrice,
    perPerson,
    doubleSharing: p.doubleSharing || perPerson,
    tripleSharing: p.tripleSharing || Math.round(perPerson * 0.92),
    quadSharing: p.quadSharing || Math.round(perPerson * 0.88),
  };
}

export function defaultPackageState(destination = 'Himachal Pradesh') {
  const days = 5;
  const nights = 4;
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
    meals: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      breakfast: 'Hotel',
      lunch: 'On own',
      dinner: 'Hotel',
      snacks: '',
      specialDinner: '',
    })),
    pricing: { ...defaultPricing },
    inclusions: [''],
    exclusions: [''],
    cancellationPolicy: { content: '', refundRules: '', slabs: [] },
    importantNotes: {
      travelGuidelines: '',
      documentsRequired: 'Valid ID proof, passport if international',
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
  };
}

export function packageFromApi(pkg = {}) {
  const destination = pkg.destination || 'Himachal Pradesh';
  const days = pkg.days || pkg.duration || 5;
  const base = defaultPackageState(destination);
  return {
    ...base,
    ...pkg,
    itinerary: (pkg.itinerary?.length ? pkg.itinerary : base.itinerary).map((d, i) => ({
      ...defaultItineraryDay(d.day || i + 1, destination),
      ...d,
      id: d._id || d.id || `day-${i}`,
    })),
    inclusions: pkg.inclusions?.length ? pkg.inclusions : [''],
    exclusions: pkg.exclusions?.length ? pkg.exclusions : [''],
    meals: pkg.meals?.length
      ? pkg.meals
      : Array.from({ length: days }, (_, i) => ({ day: i + 1, breakfast: 'Hotel', lunch: '', dinner: 'Hotel', snacks: '', specialDinner: '' })),
    pricing: { ...defaultPricing, ...(pkg.pricing || {}) },
    cancellationPolicy: { content: '', refundRules: '', slabs: [], ...(pkg.cancellationPolicy || {}) },
    importantNotes: { ...base.importantNotes, ...(pkg.importantNotes || {}) },
    seo: { ...base.seo, ...(pkg.seo || {}) },
    features: { ...base.features, ...(pkg.features || {}) },
    destinations: pkg.destinations || [],
    hotels: pkg.hotels || [],
    transport: pkg.transport || [],
    activities: pkg.activities || [],
    gallery: pkg.gallery || [],
    videos: pkg.videos || [],
    tags: pkg.tags || [],
  };
}

export function packageToPayload(state) {
  const pricing = calculatePackagePricing(state.pricing, 2);
  return {
    ...state,
    slug: state.slug || slugify(state.name),
    days: state.days || state.duration,
    nights: state.nights ?? Math.max(0, (state.days || state.duration) - 1),
    duration: state.days || state.duration,
    startingPrice: pricing.finalPrice || state.startingPrice || 0,
    pricing,
    inclusions: (state.inclusions || []).filter((x) => String(x).trim()),
    exclusions: (state.exclusions || []).filter((x) => String(x).trim()),
    itinerary: (state.itinerary || []).map(({ id, ...rest }) => rest),
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
    activities: pkg.activities,
    source: 'local',
  };
}
