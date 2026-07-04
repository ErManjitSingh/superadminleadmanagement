import { MEAL_PLANS } from '../quotations/constants';
import { normalizeCabType, FLEET_CATALOG } from './fleetConstants';

export function defaultBuilderUi() {
  return {
    skipHotel: false,
    hotelMode: 'same',
    sameHotel: {
      name: '',
      checkIn: '',
      checkOut: '',
      roomType: 'Deluxe',
      mealPlan: MEAL_PLANS[2] || 'MAP (Breakfast + Dinner)',
    },
    destinationHotels: [],
    transportMode: 'fleet',
    fleetCategory: 'Sedan',
    fleetVehicle: FLEET_CATALOG.Sedan[0] || 'Swift Dzire',
    vehicleCount: 1,
    perVehicleCost: 0,
    manualTransport: {
      vehicleName: '',
      vehicleType: 'Sedan',
      price: 0,
      notes: '',
    },
    aiPrompt: '',
    internalNotes: '',
  };
}

export function emptyDestinationHotel(destination = '') {
  return {
    id: `dh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    destination,
    name: '',
    checkIn: '',
    checkOut: '',
    roomType: 'Deluxe',
    mealPlan: MEAL_PLANS[2] || 'MAP (Breakfast + Dinner)',
  };
}

/** Map simplified UI state → backend hotels[] */
export function builderUiToHotels(builderUi = {}, destinations = []) {
  if (builderUi.skipHotel) return [];

  if (builderUi.hotelMode === 'per_destination') {
    return (builderUi.destinationHotels || [])
      .filter((h) => h.name?.trim())
      .map((h, index) => ({
        day: index + 1,
        name: h.name,
        location: h.destination || '',
        category: '4 Star',
        roomType: h.roomType || 'Deluxe',
        mealPlan: h.mealPlan || '',
        checkIn: h.checkIn || '',
        checkOut: h.checkOut || '',
        nights: h.nights || 0,
        image: '',
        alternatives: [],
      }));
  }

  const same = builderUi.sameHotel || {};
  if (!same.name?.trim()) return [];

  return [
    {
      day: 1,
      name: same.name,
      location: destinations[0]?.name || '',
      category: '4 Star',
      roomType: same.roomType || 'Deluxe',
      mealPlan: same.mealPlan || '',
      checkIn: same.checkIn || '',
      checkOut: same.checkOut || '',
      nights: same.nights || 0,
      image: '',
      alternatives: [],
    },
  ];
}

/** Map simplified UI state → backend transport[] */
export function builderUiToTransport(builderUi = {}) {
  const count = Number(builderUi.vehicleCount) || 1;
  const perVehicle = Number(builderUi.perVehicleCost) || 0;
  const totalCost = perVehicle * count;

  if (builderUi.transportMode === 'manual') {
    const m = builderUi.manualTransport || {};
    if (!m.vehicleName?.trim()) return [];
    return [
      {
        type: normalizeCabType(m.vehicleType).toLowerCase().replace(/\s+/g, '_'),
        vehicle: m.vehicleName,
        pickup: '',
        drop: '',
        distance: '',
        driver: 'Included',
        nightCharges: 0,
        parking: 0,
        toll: 0,
        fuel: 0,
        cost: Number(m.price) || totalCost,
        notes: m.notes || '',
        vehicleCount: count,
      },
    ];
  }

  if (!builderUi.fleetVehicle) return [];

  return [
    {
      type: normalizeCabType(builderUi.fleetCategory).toLowerCase().replace(/\s+/g, '_'),
      vehicle: builderUi.fleetVehicle,
      pickup: '',
      drop: '',
      distance: '',
      driver: 'Included',
      nightCharges: 0,
      parking: 0,
      toll: 0,
      fuel: 0,
      cost: totalCost,
      notes: `${count} vehicle(s) · ${builderUi.fleetCategory}`,
      vehicleCount: count,
    },
  ];
}

/** Infer builderUi from existing package (edit mode) */
export function builderUiFromPackage(pkg = {}) {
  const base = defaultBuilderUi();
  const hotels = pkg.hotels || [];
  const transport = pkg.transport || [];

  if (!hotels.length) {
    base.skipHotel = true;
  } else if (hotels.length === 1) {
    base.hotelMode = 'same';
    base.sameHotel = {
      name: hotels[0].name || '',
      checkIn: hotels[0].checkIn || '',
      checkOut: hotels[0].checkOut || '',
      roomType: hotels[0].roomType || 'Deluxe',
      mealPlan: hotels[0].mealPlan || base.sameHotel.mealPlan,
    };
  } else {
    base.hotelMode = 'per_destination';
    base.destinationHotels = hotels.map((h, i) => ({
      ...emptyDestinationHotel(h.location || ''),
      id: `dh-${i}`,
      destination: h.location || '',
      name: h.name || '',
      checkIn: h.checkIn || '',
      checkOut: h.checkOut || '',
      roomType: h.roomType || 'Deluxe',
      mealPlan: h.mealPlan || base.sameHotel.mealPlan,
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
  }

  base.internalNotes =
    typeof pkg.importantNotes === 'string'
      ? pkg.importantNotes
      : pkg.importantNotes?.travelGuidelines || '';

  return base;
}

/** Quotation PDF snapshot — hotels */
export function builderUiToSelectedHotelsSnapshot(builderUi = {}, destinations = []) {
  if (builderUi.skipHotel) return [];
  return builderUiToHotels(builderUi, destinations).map((h) => ({
    day: h.day,
    _id: `hotel-${h.day}`,
    name: h.name,
    location: h.location,
    city: h.location,
    room: { name: h.roomType },
    mealPlan: { label: h.mealPlan },
    nights: 1,
    price: 0,
    total: 0,
    externalSource: 'manual',
  }));
}

/** Quotation save payload — transport as cab snapshots */
export function builderUiToSelectedCabs(builderUi = {}) {
  return builderUiToTransport(builderUi).map((t, index) => ({
    _id: `quote-transport-${index}`,
    vehicleName: t.vehicle,
    vehicleType: builderUi.fleetCategory || builderUi.manualTransport?.vehicleType || 'SUV',
    cost: Number(t.cost) || 0,
    pickupLocation: '',
    dropLocation: '',
    notes: t.notes || '',
  }));
}
