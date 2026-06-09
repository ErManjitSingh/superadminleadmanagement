const ApiError = require('../utils/apiError');
const {
  unwrapPayload,
  unwrapListPayload,
  sanitizeImageUrl,
  sanitizeImages,
  unoFetch,
} = require('./unoHotelsApiClient');

function inferCityFromDestination(destination = '') {
  const text = String(destination || '').trim();
  if (!text) return '';
  const firstPart = text.split(',')[0]?.trim() || text;
  return firstPart.replace(/\s+(India|Himachal Pradesh|Uttarakhand)$/i, '').trim() || firstPart;
}

function buildMealPlanOptions(mealPlans = {}) {
  const breakfast = Number(mealPlans.breakfast) || 0;
  const lunch = Number(mealPlans.lunch) || 0;
  const dinner = Number(mealPlans.dinner) || 0;

  return [
    { key: 'ep', label: 'EP (Room Only)', price: 0, meals: [] },
    { key: 'cp', label: 'CP — Breakfast', price: breakfast, meals: ['breakfast'] },
    { key: 'map', label: 'MAP — Breakfast + Dinner', price: breakfast + dinner, meals: ['breakfast', 'dinner'] },
    { key: 'ap', label: 'AP — All Meals', price: breakfast + lunch + dinner, meals: ['breakfast', 'lunch', 'dinner'] },
  ];
}

function mapHotelSummary(hotel = {}) {
  return {
    _id: hotel.id,
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    city: hotel.city,
    state: hotel.state,
    country: hotel.country,
    address: hotel.address,
    location: [hotel.city, hotel.state].filter(Boolean).join(', '),
    category: hotel.star_category ? `${hotel.star_category} Star` : 'Hotel',
    starCategory: hotel.star_category,
    thumbnailUrl: sanitizeImageUrl(hotel.thumbnail_url),
    images: sanitizeImages(hotel.images),
    startingPrice: Number(hotel.starting_price || 0),
    currency: hotel.currency || 'INR',
    amenities: hotel.amenities || [],
    tags: hotel.tags || [],
    rating: hotel.rating || 0,
    reviewCount: hotel.review_count || 0,
    description: hotel.description || '',
    externalSource: 'uno_hotels',
  };
}

function mapRoom(room = {}) {
  return {
    _id: room.id,
    id: room.id,
    hotelId: room.hotel_id,
    name: room.name,
    description: room.description || '',
    maxOccupancy: room.max_occupancy,
    bedType: room.bed_type,
    sizeSqft: room.size_sqft,
    amenities: room.amenities || [],
    images: sanitizeImages(room.images),
    pricePerNight: Number(room.price_per_night || 0),
    available: room.available !== false,
    availableCount: room.available_count,
    mealPlanOptions: buildMealPlanOptions(room.meal_plans),
    rawMealPlans: room.meal_plans || {},
  };
}

async function listUnoHotels(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(Number(query.limit) || 24, 100);
  const city = query.city || inferCityFromDestination(query.destination);

  const searchQuery = {
    page,
    limit,
    sort: query.sort || 'popular',
    ...(city ? { city } : {}),
    ...(query.star_category ? { star_category: query.star_category } : {}),
  };

  let raw;
  try {
    raw = await unoFetch('/v1/hotels/search', { query: searchQuery });
  } catch {
    raw = await unoFetch('/v1/hotels/featured', { query: { limit } });
  }

  const rows = unwrapListPayload(raw).map(mapHotelSummary);
  const meta = unwrapPayload(raw);

  return {
    items: rows,
    total: meta.total ?? meta.count ?? rows.length,
    page: meta.page ?? page,
    limit: meta.limit ?? limit,
    city: city || null,
    source: 'uno_hotels',
  };
}

async function getUnoHotelDetail({ city, slug }) {
  if (!city?.trim() || !slug?.trim()) {
    throw new ApiError(400, 'Hotel city and slug are required');
  }

  const encodedCity = encodeURIComponent(city.trim());
  const encodedSlug = encodeURIComponent(slug.trim());
  const raw = await unoFetch(`/v1/hotels/${encodedCity}/${encodedSlug}`);
  const hotel = unwrapPayload(raw);

  return {
    ...mapHotelSummary(hotel),
    checkInTime: hotel.check_in_time,
    checkOutTime: hotel.check_out_time,
    policies: hotel.policies || {},
    photoCategories: hotel.photo_categories || [],
    rooms: (hotel.rooms || []).map(mapRoom),
  };
}

module.exports = {
  listUnoHotels,
  getUnoHotelDetail,
  buildMealPlanOptions,
  inferCityFromDestination,
  mapHotelSummary,
  mapRoom,
};
