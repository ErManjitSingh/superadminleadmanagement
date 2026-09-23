import { MEAL_PLANS, isNoHotelMealPlan } from '../quotations/constants';
import { normalizeCabType, FLEET_CATALOG } from './fleetConstants';

export function defaultBuilderUi() {
  return {
    skipHotel: false,
    hotelMode: 'per_destination',
    sameHotel: {
      entryMode: 'existing',
      hotelId: '',
      name: '',
      checkIn: '',
      checkOut: '',
      roomType: 'Deluxe',
      mealPlan: '',
      phone: '',
    },
    destinationHotels: [emptyDestinationHotel()],
    transportMode: 'fleet',
    fleetCategory: 'Sedan',
    fleetVehicle: FLEET_CATALOG.Sedan[0] || 'Swift Dzire',
    vehicleCount: 1,
    perVehicleCost: 0,
    vendorMode: 'existing',
    vendorId: '',
    vendorName: '',
    vendorPhone: '',
    pickupLocation: '',
    dropLocation: '',
    manualTransport: {
      vehicleName: '',
      vehicleType: 'Sedan',
      price: 0,
      notes: '',
    },
    // Second cab choice — client picks one
    showCabOption2: false,
    cabOption2: {
      vehicleName: '',
      vehicleType: 'Sedan',
      price: 0,
      vehicleCount: 1,
    },
    aiPrompt: '',
    internalNotes: '',
  };
}

export function emptyDestinationHotel(destination = '') {
  return {
    id: `dh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    destination,
    entryMode: 'existing',
    hotelId: '',
    name: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Deluxe',
    mealPlan: '',
    phone: '',
    price: 0,
    // Second hotel choice for same nights — client picks one
    alternative: null,
  };
}

/** Parse YYYY-MM-DD as local date. */
function parseDateOnly(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const parts = s.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !n)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function nightsFromHotelDates(h = {}) {
  const n = Number(h.nights);
  if (Number.isFinite(n) && n > 0) return n;
  const start = parseDateOnly(h.checkIn);
  const end = parseDateOnly(h.checkOut);
  if (!start || !end) return 1;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Trip day (1-based) from check-in relative to travel date. */
function dayFromCheckIn(travelDate, checkIn) {
  const start = parseDateOnly(travelDate);
  const inDate = parseDateOnly(checkIn);
  if (!start || !inDate) return null;
  return Math.round((inDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/** Map simplified UI state → backend hotels[] */
export function builderUiToHotels(builderUi = {}, destinations = [], travelDate = '') {
  if (builderUi.skipHotel) return [];

  // Always prefer per-destination hotels; legacy sameHotel is folded in as one stay
  const list = (builderUi.destinationHotels || []).filter((h) => h.name?.trim());
  const hotelsSource = list.length
    ? list
    : (builderUi.sameHotel?.name?.trim()
      ? [{ ...builderUi.sameHotel, destination: builderUi.sameHotel.location || destinations[0]?.name || '' }]
      : []);

  let nextDay = 1;
  return hotelsSource.map((h) => {
    const nights = nightsFromHotelDates(h);
    const fromCheckIn = dayFromCheckIn(travelDate, h.checkIn);
    const day = fromCheckIn && fromCheckIn > 0 ? fromCheckIn : nextDay;
    nextDay = day + nights;
    return {
      day,
      hotelId: h.hotelId || undefined,
      name: h.name,
      location: h.destination || h.location || '',
      category: h.category || '4 Star',
      roomType: h.roomType || 'Deluxe',
      mealPlan: h.mealPlan || '',
      phone: h.phone || '',
      checkIn: h.checkIn || '',
      checkOut: h.checkOut || '',
      nights,
      image: '',
      price: Number(h.price) || 0,
      alternatives: h.alternative?.name?.trim()
        ? [
            {
              name: h.alternative.name,
              hotelId: h.alternative.hotelId || undefined,
              category: h.alternative.category || '4 Star',
              roomType: h.alternative.roomType || 'Deluxe',
              mealPlan: h.alternative.mealPlan || '',
              price: Number(h.alternative.price) || 0,
              label: 'Option 2',
            },
          ]
        : [],
    };
  });
}

/** Map simplified UI state → backend transport[] (Option 1 + optional Option 2) */
export function builderUiToTransport(builderUi = {}) {
  const count = Number(builderUi.vehicleCount) || 1;
  const perVehicle = Number(builderUi.perVehicleCost) || 0;
  const totalCost = perVehicle * count;
  const vendorFields = {
    vendorId: builderUi.vendorId || undefined,
    vendorName: builderUi.vendorName || '',
    vendorPhone: builderUi.vendorPhone || '',
  };

  const rows = [];

  if (builderUi.transportMode === 'manual') {
    const m = builderUi.manualTransport || {};
    if (m.vehicleName?.trim()) {
      rows.push({
        type: normalizeCabType(m.vehicleType).toLowerCase().replace(/\s+/g, '_'),
        vehicle: m.vehicleName,
        pickup: builderUi.pickupLocation || '',
        drop: builderUi.dropLocation || '',
        distance: '',
        driver: 'Included',
        nightCharges: 0,
        parking: 0,
        toll: 0,
        fuel: 0,
        cost: Number(m.price) || totalCost,
        notes: m.notes || '',
        vehicleCount: count,
        optionLabel: 'Option 1',
        ...vendorFields,
      });
    }
  } else if (builderUi.fleetVehicle) {
    rows.push({
      type: normalizeCabType(builderUi.fleetCategory).toLowerCase().replace(/\s+/g, '_'),
      vehicle: builderUi.fleetVehicle,
      pickup: builderUi.pickupLocation || '',
      drop: builderUi.dropLocation || '',
      distance: '',
      driver: 'Included',
      nightCharges: 0,
      parking: 0,
      toll: 0,
      fuel: 0,
      cost: totalCost,
      notes: `${count} vehicle(s) · ${builderUi.fleetCategory}`,
      vehicleCount: count,
      optionLabel: 'Option 1',
      ...vendorFields,
    });
  }

  const alt = builderUi.cabOption2 || {};
  if (builderUi.showCabOption2 && String(alt.vehicleName || '').trim()) {
    const altCount = Number(alt.vehicleCount) || count || 1;
    rows.push({
      type: normalizeCabType(alt.vehicleType || 'Sedan').toLowerCase().replace(/\s+/g, '_'),
      vehicle: alt.vehicleName,
      pickup: builderUi.pickupLocation || '',
      drop: builderUi.dropLocation || '',
      distance: '',
      driver: 'Included',
      nightCharges: 0,
      parking: 0,
      toll: 0,
      fuel: 0,
      cost: Number(alt.price) || 0,
      notes: 'Cab Option 2 — client chooses one',
      vehicleCount: altCount,
      optionLabel: 'Option 2',
      isAlternative: true,
      ...vendorFields,
    });
  }

  return rows;
}

/** Infer builderUi from existing package (edit mode) */
export function builderUiFromPackage(pkg = {}) {
  const base = defaultBuilderUi();
  const hotels = pkg.hotels || [];
  const transport = pkg.transport || [];

  if (!hotels.length) {
    base.skipHotel = true;
  } else {
    base.hotelMode = 'per_destination';
    base.destinationHotels = hotels.map((h, i) => ({
      ...emptyDestinationHotel(h.location || ''),
      id: `dh-${i}`,
      destination: h.location || '',
      entryMode: h.hotelId ? 'existing' : 'new',
      hotelId: h.hotelId || '',
      name: h.name || '',
      category: h.category || '',
      location: h.location || '',
      checkIn: h.checkIn || '',
      checkOut: h.checkOut || '',
      roomType: h.roomType || 'Deluxe',
      mealPlan: h.mealPlan || '',
      phone: h.phone || '',
    }));
  }

  if (transport.length) {
    const t = transport[0];
    const fromFleet = Boolean(t.vehicle && !t.notes?.includes('manual'));
    if (fromFleet || t.vehicle) {
      base.transportMode = 'fleet';
      base.fleetCategory = t.vehicle?.includes('Innova') ? 'SUV' : 'Sedan';
      base.fleetVehicle = t.vehicle || '';
      base.vehicleCount = t.vehicleCount || 1;
      base.perVehicleCost = t.vehicleCount
        ? Math.round((Number(t.cost) || 0) / (t.vehicleCount || 1))
        : Number(t.cost) || 0;
    } else {
      base.transportMode = 'manual';
      base.manualTransport = {
        vehicleName: t.vehicle || '',
        vehicleType: t.type || 'SUV',
        price: Number(t.cost) || 0,
        notes: t.notes || '',
      };
      base.vehicleCount = t.vehicleCount || 1;
    }
    base.vendorId = t.vendorId || '';
    base.vendorName = t.vendorName || '';
    base.vendorPhone = t.vendorPhone || '';
    base.vendorMode = t.vendorId ? 'existing' : (t.vendorName ? 'new' : 'existing');
  }

  base.internalNotes =
    typeof pkg.importantNotes === 'string'
      ? pkg.importantNotes
      : pkg.importantNotes?.travelGuidelines || '';

  return base;
}

/** Infer builderUi from a saved quotation (edit mode) */
export function builderUiFromQuotation(quote = {}) {
  const snap = quote.packageSnapshot || quote.package || {};
  const selected = Array.isArray(quote.selectedHotels) ? quote.selectedHotels : [];
  const hotelsFromSnap = Array.isArray(snap.hotels) ? snap.hotels : [];
  const hotels = (selected.length ? selected : hotelsFromSnap).map((h, i) => {
    const alt = Array.isArray(h.alternatives) && h.alternatives[0] ? h.alternatives[0] : null;
    return {
      day: h.day || i + 1,
      hotelId: h.hotelId || h._id || '',
      name: h.name || h.hotelName || '',
      location: h.location || h.city || '',
      destination: h.location || h.city || '',
      category: h.category || '',
      roomType: h.room?.name || h.roomType || 'Deluxe',
      mealPlan: h.mealPlan?.label || (typeof h.mealPlan === 'string' ? h.mealPlan : '') || '',
      checkIn: h.checkIn ? String(h.checkIn).slice(0, 10) : '',
      checkOut: h.checkOut ? String(h.checkOut).slice(0, 10) : '',
      nights: h.nights || 0,
      phone: h.phone || h.hotelPhone || '',
      price: Number(h.price || h.total) || 0,
      alternative: alt
        ? {
            name: alt.name || '',
            hotelId: alt.hotelId || '',
            category: alt.category || '4 Star',
            roomType: alt.roomType || 'Deluxe',
            mealPlan: alt.mealPlan || '',
            price: Number(alt.price) || 0,
            entryMode: 'new',
          }
        : null,
    };
  }).filter((h) => h.name);

  const cabs = Array.isArray(quote.selectedCabs) ? quote.selectedCabs : [];
  const primaryCab = cabs.find((c) => !c.isAlternative && c.optionLabel !== 'Option 2') || cabs[0];
  const altCab = cabs.find((c) => c.isAlternative || c.optionLabel === 'Option 2');
  const transport = primaryCab
    ? [
        {
          vehicle: primaryCab.vehicleName || primaryCab.name || '',
          type: primaryCab.vehicleType || primaryCab.type || '',
          cost: Number(primaryCab.cost || primaryCab.price) || 0,
          vehicleCount: primaryCab.vehicleCount || primaryCab.count || 1,
          notes: primaryCab.notes || '',
          vendorId: primaryCab.vendorId || '',
          vendorName: primaryCab.vendorName || '',
          vendorPhone: primaryCab.vendorPhone || '',
        },
      ]
    : [];

  const base = builderUiFromPackage({
    ...snap,
    hotels,
    transport,
    importantNotes: quote.importantNotes || snap.importantNotes,
  });

  // Restore per-hotel price + alternative onto destinationHotels
  if (hotels.length && base.destinationHotels?.length) {
    base.destinationHotels = base.destinationHotels.map((dh, i) => ({
      ...dh,
      price: hotels[i]?.price || 0,
      alternative: hotels[i]?.alternative || null,
    }));
  }

  if (altCab) {
    base.showCabOption2 = true;
    base.cabOption2 = {
      vehicleName: altCab.vehicleName || altCab.name || '',
      vehicleType: altCab.vehicleType || altCab.type || 'Sedan',
      price: Number(altCab.cost || altCab.price) || 0,
      vehicleCount: altCab.vehicleCount || altCab.count || 1,
    };
  }

  if (quote.packageInfo?.mealPlan && isNoHotelMealPlan(quote.packageInfo.mealPlan)) {
    base.skipHotel = true;
  }
  return base;
}

/** Quotation PDF snapshot — hotels */
export function builderUiToSelectedHotelsSnapshot(builderUi = {}, destinations = [], travelDate = '') {
  if (builderUi.skipHotel) return [];
  return builderUiToHotels(builderUi, destinations, travelDate).map((h) => {
    const nights = nightsFromHotelDates(h);
    return {
      day: h.day,
      _id: h.hotelId || `hotel-${h.day}`,
      hotelId: h.hotelId,
      name: h.name,
      location: h.location,
      city: h.location,
      category: h.category || '4 Star',
      room: { name: h.roomType },
      roomType: h.roomType,
      mealPlan: { label: h.mealPlan },
      meals: h.mealPlan,
      checkIn: h.checkIn || '',
      checkOut: h.checkOut || '',
      nights,
      phone: h.phone || '',
      hotelPhone: h.phone || '',
      price: Number(h.price) || 0,
      total: Number(h.price) || 0,
      optionLabel: 'Option 1',
      alternatives: Array.isArray(h.alternatives) ? h.alternatives : [],
      externalSource: h.hotelId ? 'catalog' : 'manual',
    };
  });
}

/** Quotation save payload — transport as cab snapshots (Option 1 + Option 2) */
export function builderUiToSelectedCabs(builderUi = {}) {
  return builderUiToTransport(builderUi).map((t, index) => ({
    _id: t.vendorId || `quote-transport-${index}`,
    vehicleName: t.vehicle,
    vehicleType:
      t.optionLabel === 'Option 2'
        ? builderUi.cabOption2?.vehicleType || 'Sedan'
        : builderUi.fleetCategory || builderUi.manualTransport?.vehicleType || 'SUV',
    cost: Number(t.cost) || 0,
    vehicleCount: t.vehicleCount || Number(builderUi.vehicleCount) || 1,
    pickupLocation: builderUi.pickupLocation || t.pickup || '',
    dropLocation: builderUi.dropLocation || t.drop || '',
    notes: t.notes || '',
    optionLabel: t.optionLabel || `Option ${index + 1}`,
    isAlternative: Boolean(t.isAlternative),
    vendorId: t.vendorId,
    vendorName: t.vendorName || '',
    vendorPhone: t.vendorPhone || '',
  }));
}
