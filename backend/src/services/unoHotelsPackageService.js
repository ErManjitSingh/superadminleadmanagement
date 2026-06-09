const ApiError = require('../utils/apiError');
const { inferCityFromDestination, matchesDestination } = require('../utils/destinationMatch');
const {
  unwrapPayload,
  sanitizeImageUrl,
  unoFetch,
} = require('./unoHotelsApiClient');

function parseDurationDays(pkg = {}) {
  if (pkg.duration_days > 0) return pkg.duration_days;
  const match = String(pkg.duration_label || '').match(/(\d+)\s*D/i);
  return match ? Number(match[1]) : 1;
}

function mapItineraryDays(days = []) {
  return days.map((day) => ({
    id: day.id || `day-${day.day_number}`,
    day: day.day_number,
    title: day.title || `Day ${day.day_number}`,
    description: day.description || '',
    hotel: day.hotel_name || '',
    activities: [day.arrival, day.transport].filter(Boolean).join(' · '),
    meals: Array.isArray(day.meals_selected) && day.meals_selected.length
      ? day.meals_selected.join(', ')
      : day.dinner || '',
    transport: day.transport || day.cab_name || day.transport_mode || '',
    accommodation: day.hotel_name || '',
  }));
}

function buildFallbackItinerary(pkg, destination) {
  const days = parseDurationDays(pkg);
  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    return {
      id: `day-${pkg.id || pkg.slug || 'pkg'}-${day}`,
      day,
      title: day === 1 ? `Arrival in ${destination}` : `Day ${day} in ${destination}`,
      description: pkg.short_description || pkg.description || '',
      hotel: '',
      activities: '',
      meals: 'Breakfast',
      transport: 'Private Cab',
      accommodation: '',
    };
  });
}

function mapUnoPackage(pkg, { includeItinerary = false } = {}) {
  const destination =
    pkg.destination_city ||
    pkg.destination_name ||
    [pkg.state, pkg.country].filter(Boolean).join(', ') ||
    'India';

  const mapped = {
    _id: pkg.id,
    id: pkg.id,
    slug: pkg.slug,
    name: pkg.name,
    destination,
    duration: parseDurationDays(pkg),
    durationLabel: pkg.duration_label || `${parseDurationDays(pkg)}D`,
    startingPrice: Number(pkg.discounted_price ?? pkg.base_price ?? 0),
    packageType: pkg.tour_type || 'family',
    currency: pkg.currency || 'INR',
    coverImage: sanitizeImageUrl(pkg.featured_image),
    shortDescription: pkg.short_description || '',
    description: pkg.description || '',
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || [],
    highlights: pkg.highlight_icons || [],
    externalSource: 'uno_hotels',
    status: pkg.status,
  };

  if (includeItinerary) {
    const itineraryDays = Array.isArray(pkg.itinerary_days) ? pkg.itinerary_days : [];
    mapped.itinerary =
      itineraryDays.length > 0
        ? mapItineraryDays(itineraryDays)
        : buildFallbackItinerary(pkg, destination);
  }

  return mapped;
}

async function listUnoPackages(query = {}) {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const search = query.search || inferCityFromDestination(query.destination) || '';
  const useAdmin = Boolean(
    process.env.UNO_HOTELS_ADMIN_TOKEN ||
      (process.env.UNO_HOTELS_ADMIN_EMAIL && process.env.UNO_HOTELS_ADMIN_PASSWORD)
  );

  if (useAdmin) {
    const page = Math.max(1, Number(query.page) || 1);
    const payload = await unoFetch('/admin/v1/packages', {
      admin: true,
      query: {
        page,
        limit,
        search: search || undefined,
        status: query.status || 'published',
        tour_type: query.tour_type || undefined,
        destination_id: query.destination_id || undefined,
      },
    });
    const unwrapped = unwrapPayload(payload);
    const items = (unwrapped.items || []).map((pkg) => mapUnoPackage(pkg));
    const filtered = query.destination
      ? items.filter((pkg) => matchesDestination(pkg, query.destination))
      : items;

    return {
      items: filtered,
      total: filtered.length,
      page: unwrapped.page ?? page,
      limit: unwrapped.limit ?? limit,
      totalPages: unwrapped.total_pages ?? 1,
      source: 'uno_hotels_admin',
      destination: query.destination || null,
    };
  }

  const page = Math.max(1, Number(query.page) || 1);
  const payload = await unoFetch('/v1/packages', {
    query: {
      page,
      limit,
      search: search || undefined,
      tour_type: query.tour_type || undefined,
      destination_id: query.destination_id || undefined,
    },
  });
  const unwrapped = unwrapPayload(payload);

  const items = (unwrapped.items || []).map((pkg) => mapUnoPackage(pkg));
  const filtered = query.destination
    ? items.filter((pkg) => matchesDestination(pkg, query.destination))
    : items;

  return {
    items: filtered,
    total: filtered.length,
    page: unwrapped.page ?? page,
    limit: unwrapped.limit ?? limit,
    totalPages: unwrapped.total_pages ?? 1,
    source: 'uno_hotels_public',
    destination: query.destination || null,
  };
}

async function getUnoPackageById(packageId) {
  const useAdmin = Boolean(
    process.env.UNO_HOTELS_ADMIN_TOKEN ||
      (process.env.UNO_HOTELS_ADMIN_EMAIL && process.env.UNO_HOTELS_ADMIN_PASSWORD)
  );

  if (useAdmin) {
    const payload = await unoFetch(`/admin/v1/packages/${packageId}`, { admin: true });
    return mapUnoPackage(unwrapPayload(payload), { includeItinerary: true });
  }

  const list = await listUnoPackages({ limit: 50, page: 1 });
  const summary = list.items.find((item) => item.id === packageId || item._id === packageId);
  if (!summary) throw new ApiError(404, 'Package not found in Uno Hotels catalog');

  if (summary.slug) {
    try {
      const detail = await unoFetch(`/v1/packages/${summary.slug}`);
      return mapUnoPackage(unwrapPayload(detail), { includeItinerary: true });
    } catch {
      /* fall back to summary */
    }
  }

  return mapUnoPackage(
    {
      ...summary,
      id: summary.id || summary._id,
      duration_days: summary.duration,
      duration_label: summary.durationLabel,
      base_price: summary.startingPrice,
      tour_type: summary.packageType,
      destination_city: summary.destination,
    },
    { includeItinerary: true }
  );
}

module.exports = {
  listUnoPackages,
  getUnoPackageById,
  mapUnoPackage,
};
