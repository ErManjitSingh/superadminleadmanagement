/** Static fleet catalog — merged with live /cabs inventory at runtime */
export const FLEET_CATEGORIES = [
  { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Tempo Traveller', label: 'Tempo Traveller' },
  { value: 'Luxury', label: 'Luxury' },
  { value: 'Mini Bus', label: 'Mini Bus' },
  { value: 'Bus', label: 'Bus' },
];

export const FLEET_CATALOG = {
  Sedan: ['Swift Dzire', 'Honda Amaze', 'Toyota Etios', 'Hyundai Aura'],
  SUV: ['Ertiga', 'Innova', 'Innova Crysta', 'Scorpio', 'Xylo', 'Fortuner'],
  'Tempo Traveller': ['12 Seater', '17 Seater', '26 Seater'],
  Luxury: ['Mercedes E-Class', 'BMW 5 Series', 'Audi A6'],
  'Mini Bus': ['20 Seater Mini Bus', '25 Seater Mini Bus'],
  Bus: ['35 Seater Bus', '45 Seater Bus', '52 Seater Bus'],
};

/** Seats / bags / image for fleet cards */
export const VEHICLE_META = {
  'Swift Dzire': {
    seats: 4,
    bags: 2,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=240&fit=crop',
  },
  'Honda Amaze': {
    seats: 4,
    bags: 2,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=240&fit=crop',
  },
  'Toyota Etios': {
    seats: 4,
    bags: 2,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=240&fit=crop',
  },
  'Hyundai Aura': {
    seats: 4,
    bags: 2,
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=240&fit=crop',
  },
  Ertiga: {
    seats: 6,
    bags: 3,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=240&fit=crop',
  },
  Innova: {
    seats: 7,
    bags: 4,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=240&fit=crop',
  },
  'Innova Crysta': {
    seats: 7,
    bags: 4,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=240&fit=crop',
  },
  Scorpio: {
    seats: 7,
    bags: 3,
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&h=240&fit=crop',
  },
  Xylo: {
    seats: 7,
    bags: 3,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=240&fit=crop',
  },
  Fortuner: {
    seats: 7,
    bags: 4,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400&h=240&fit=crop',
  },
  '12 Seater': { seats: 12, bags: 8, image: '' },
  '17 Seater': { seats: 17, bags: 10, image: '' },
  '26 Seater': { seats: 26, bags: 14, image: '' },
  'Mercedes E-Class': {
    seats: 4,
    bags: 3,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=240&fit=crop',
  },
  'BMW 5 Series': {
    seats: 4,
    bags: 3,
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=240&fit=crop',
  },
  'Audi A6': {
    seats: 4,
    bags: 3,
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=240&fit=crop',
  },
  '20 Seater Mini Bus': { seats: 20, bags: 12, image: '' },
  '25 Seater Mini Bus': { seats: 25, bags: 14, image: '' },
  '35 Seater Bus': { seats: 35, bags: 20, image: '' },
  '45 Seater Bus': { seats: 45, bags: 25, image: '' },
  '52 Seater Bus': { seats: 52, bags: 30, image: '' },
};

export const ROOM_TYPES = ['Standard', 'Deluxe', 'Super Deluxe', 'Luxury', 'Premium', 'Suite'];

export const VEHICLE_COUNT_OPTIONS = [1, 2, 3, 4, 5];

export function getVehicleMeta(name, category = 'Sedan') {
  const meta = VEHICLE_META[name];
  if (meta) return meta;
  const defaults = {
    Sedan: { seats: 4, bags: 2 },
    SUV: { seats: 6, bags: 3 },
    'Tempo Traveller': { seats: 12, bags: 8 },
    Luxury: { seats: 4, bags: 3 },
    'Mini Bus': { seats: 20, bags: 12 },
    Bus: { seats: 40, bags: 20 },
  };
  return { ...(defaults[category] || { seats: 4, bags: 2 }), image: '' };
}

export function mergeFleetWithCabs(cabs = []) {
  const merged = { ...FLEET_CATALOG };
  cabs.forEach((cab) => {
    const type = cab.vehicleType || 'SUV';
    const name = cab.vehicleName || cab.vehicleType;
    if (!name) return;
    if (!merged[type]) merged[type] = [];
    if (!merged[type].includes(name)) merged[type].push(name);
  });
  return merged;
}

export function normalizeCabType(type = '') {
  const t = String(type).toLowerCase();
  if (t.includes('sedan')) return 'Sedan';
  if (t.includes('suv') || t.includes('innova') || t.includes('ertiga')) return 'SUV';
  if (t.includes('tempo') || t.includes('seater')) return 'Tempo Traveller';
  if (t.includes('luxury')) return 'Luxury';
  if (t.includes('mini')) return 'Mini Bus';
  if (t.includes('bus')) return 'Bus';
  return 'SUV';
}
