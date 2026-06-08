import { getPackageTypeConfig } from './quotationUtils';

export function resolveQuotePackage(quote) {
  const raw = quote?.package?.name ? quote.package : quote?.packageSnapshot || quote?.package || {};
  const itinerary = (raw.itinerary || []).map((day, i) => ({
    ...day,
    id: day.id || day._id || `day-${i}`,
    hotel: day.hotel || day.accommodation || '',
    activities: day.activities || '',
    transport: day.transport || '',
  }));
  return {
    ...raw,
    itinerary,
    highlights: raw.highlights || [],
    inclusions: raw.inclusions || [],
    exclusions: raw.exclusions || [],
    coverImage: raw.coverImage || '',
  };
}

export function resolveQuoteLead(quote) {
  return quote?.lead || {};
}

export function formatQuoteDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getQuoteTypeLabel(quote) {
  const pkg = resolveQuotePackage(quote);
  return getPackageTypeConfig(pkg.packageType).label;
}

export function perPersonAmount(pricing, travelers = 2) {
  const total = Number(pricing?.total || 0);
  const pax = Math.max(1, Number(travelers) || 2);
  return Math.round(total / pax);
}
