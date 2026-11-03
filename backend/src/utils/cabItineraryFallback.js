/**
 * Build a day-wise cab itinerary when quotation/booking has none saved.
 * Uses travel dates + duration + destination string (e.g. "Kasol Manali Sissu Shimla").
 */

function addDays(date, days) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function dayCount({ travelDate, returnDate, duration } = {}) {
  const fromDuration = Number(duration) || 0;
  if (fromDuration > 0) return Math.floor(fromDuration);

  if (travelDate && returnDate) {
    const start = new Date(travelDate);
    const end = new Date(returnDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
      return Math.max(1, diff + 1);
    }
  }
  return 0;
}

/** Split "Kasol Manali Sissu Shimla" / "Kasol, Manali" into place names. */
function splitDestinations(destination = '') {
  const raw = String(destination || '').trim();
  if (!raw) return [];
  if (/[,|/&]/.test(raw)) {
    return raw.split(/[,|/&]+/).map((s) => s.trim()).filter(Boolean);
  }
  // Multi-word destination list without commas (common in EMB quotes)
  const known = raw.match(
    /\b(Kasol|Manali|Sissu|Shimla|Kullu|Kufri|Dalhousie|Khajjiar|Dharamshala|McLeodganj|McLeod Ganj|Bir|Billing|Spiti|Jibhi|Tirthan|Chandigarh|Delhi|Amb|Pathankot|Triund|Kareri|Kheerganga|Solang|Atal Tunnel|Sangla|Kalpa|Reckong Peo|Chitkul)\b/gi,
  );
  if (known && known.length > 1) {
    // Preserve order, de-dupe case-insensitively
    const seen = new Set();
    return known.filter((p) => {
      const k = p.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
  return [raw];
}

function buildFallbackCabItinerary({
  travelDate,
  returnDate,
  duration,
  destination,
  pickup,
  drop,
  packageName,
} = {}) {
  const days = dayCount({ travelDate, returnDate, duration });
  if (days < 1) return [];

  const places = splitDestinations(destination || packageName || '');
  const startLabel = String(pickup || '').trim();
  const endLabel = String(drop || '').trim();
  const rows = [];

  for (let i = 0; i < days; i += 1) {
    const day = i + 1;
    const date = travelDate ? addDays(travelDate, i) : null;
    const place = places[Math.min(i, Math.max(places.length - 1, 0))] || destination || 'Destination';
    const nextPlace = places[Math.min(i + 1, places.length - 1)] || place;

    let title;
    let activities;
    let transport = 'Private cab';

    if (days === 1) {
      title = startLabel && endLabel
        ? `${startLabel} → ${endLabel}`
        : `Day trip — ${place}`;
      activities = `Full-day cab service${startLabel ? ` from ${startLabel}` : ''}${endLabel ? ` to ${endLabel}` : ''}`;
    } else if (i === 0) {
      title = startLabel
        ? `${startLabel} → ${place}`
        : `Arrival / transfer to ${place}`;
      activities = `Pickup${startLabel ? ` from ${startLabel}` : ''}, drive to ${place}, hotel/check-in as applicable`;
      transport = startLabel ? `${startLabel} → ${place}` : `Transfer to ${place}`;
    } else if (i === days - 1) {
      title = endLabel
        ? `${place} → ${endLabel}`
        : `Departure from ${place}`;
      activities = `Checkout and drop${endLabel ? ` at ${endLabel}` : ''}`;
      transport = endLabel ? `${place} → ${endLabel}` : `Return from ${place}`;
    } else if (places.length > 1 && place !== nextPlace && i < places.length) {
      title = `${place} → ${nextPlace}`;
      activities = `Sightseeing at ${place}, onward transfer to ${nextPlace}`;
      transport = `${place} → ${nextPlace}`;
    } else {
      title = `${place} sightseeing`;
      activities = `Local sightseeing and point-to-point transfers in/around ${place}`;
      transport = `Local cab — ${place}`;
    }

    rows.push({
      day,
      date,
      title,
      description: activities,
      activities,
      sightseeing: activities,
      transport,
      places: activities,
    });
  }

  return rows;
}

module.exports = {
  buildFallbackCabItinerary,
  splitDestinations,
  dayCount,
};
