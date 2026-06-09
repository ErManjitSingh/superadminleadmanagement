const ApiError = require('../utils/apiError');

const BASE_URL = (process.env.UNO_HOTELS_API_BASE_URL || 'https://unohotels-backend.onrender.com').replace(/\/$/, '');

let cachedAdminToken = null;
let tokenExpiresAt = 0;

function unwrapPayload(json) {
  if (!json || typeof json !== 'object') return json;
  if (json.data && typeof json.data === 'object' && !Array.isArray(json.data)) return json.data;
  return json;
}

function parseDurationDays(pkg = {}) {
  if (pkg.duration_days > 0) return pkg.duration_days;
  const match = String(pkg.duration_label || '').match(/(\d+)\s*D/i);
  return match ? Number(match[1]) : 1;
}

function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('data:')) return '';
  return url;
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

async function getAdminToken() {
  if (process.env.UNO_HOTELS_ADMIN_TOKEN) return process.env.UNO_HOTELS_ADMIN_TOKEN;

  const email = process.env.UNO_HOTELS_ADMIN_EMAIL;
  const password = process.env.UNO_HOTELS_ADMIN_PASSWORD;
  if (!email || !password) return null;

  if (cachedAdminToken && Date.now() < tokenExpiresAt) return cachedAdminToken;

  const res = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(502, json.message || 'Failed to authenticate with Uno Hotels API');
  }

  const payload = unwrapPayload(json);
  const token = payload?.tokens?.access_token;
  if (!token) throw new ApiError(502, 'Uno Hotels API login did not return an access token');

  cachedAdminToken = token;
  tokenExpiresAt = Date.now() + Math.max(60, Number(payload.tokens.expires_in || 3600) - 60) * 1000;
  return token;
}

async function unoFetch(path, { query = {}, admin = false } = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const headers = { Accept: 'application/json' };
  if (admin) {
    const token = await getAdminToken();
    if (!token) throw new ApiError(503, 'Uno Hotels admin credentials are not configured');
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status >= 500 ? 502 : res.status, json.message || 'Uno Hotels API request failed');
  }

  return unwrapPayload(json);
}

async function listUnoPackages(query = {}) {
  const limit = Math.min(Number(query.limit) || 50, 100);
  const search = query.search || '';
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

    const items = (payload.items || []).map((pkg) => mapUnoPackage(pkg));
    return {
      items,
      total: payload.total ?? items.length,
      page: payload.page ?? page,
      limit: payload.limit ?? limit,
      totalPages: payload.total_pages ?? 1,
      source: 'uno_hotels_admin',
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

  const items = (payload.items || []).map((pkg) => mapUnoPackage(pkg));
  return {
    items,
    total: payload.total ?? items.length,
    page: payload.page ?? page,
    limit: payload.limit ?? limit,
    totalPages: payload.total_pages ?? 1,
    source: 'uno_hotels_public',
  };
}

async function getUnoPackageById(packageId) {
  const useAdmin = Boolean(
    process.env.UNO_HOTELS_ADMIN_TOKEN ||
      (process.env.UNO_HOTELS_ADMIN_EMAIL && process.env.UNO_HOTELS_ADMIN_PASSWORD)
  );

  if (useAdmin) {
    const payload = await unoFetch(`/admin/v1/packages/${packageId}`, { admin: true });
    return mapUnoPackage(payload, { includeItinerary: true });
  }

  const list = await listUnoPackages({ limit: 50, page: 1 });
  const summary = list.items.find((item) => item.id === packageId || item._id === packageId);
  if (!summary) throw new ApiError(404, 'Package not found in Uno Hotels catalog');

  if (summary.slug) {
    try {
      const detail = await unoFetch(`/v1/packages/${summary.slug}`);
      return mapUnoPackage(detail, { includeItinerary: true });
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
