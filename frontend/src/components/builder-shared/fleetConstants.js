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

/** Seats / bags for fleet cards */
export const VEHICLE_META = {
  'Swift Dzire': { seats: 4, bags: 2 },
  'Honda Amaze': { seats: 4, bags: 2 },
  'Toyota Etios': { seats: 4, bags: 2 },
  'Hyundai Aura': { seats: 4, bags: 2 },
  Ertiga: { seats: 6, bags: 3 },
  Innova: { seats: 7, bags: 4 },
  'Innova Crysta': { seats: 7, bags: 4 },
  Scorpio: { seats: 7, bags: 3 },
  Xylo: { seats: 7, bags: 3 },
  Fortuner: { seats: 7, bags: 4 },
  '12 Seater': { seats: 12, bags: 8 },
  '17 Seater': { seats: 17, bags: 10 },
  '26 Seater': { seats: 26, bags: 14 },
  'Mercedes E-Class': { seats: 4, bags: 3 },
  'BMW 5 Series': { seats: 4, bags: 3 },
  'Audi A6': { seats: 4, bags: 3 },
  '20 Seater Mini Bus': { seats: 20, bags: 12 },
  '25 Seater Mini Bus': { seats: 25, bags: 14 },
  '35 Seater Bus': { seats: 35, bags: 20 },
  '45 Seater Bus': { seats: 45, bags: 25 },
  '52 Seater Bus': { seats: 52, bags: 30 },
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
  return defaults[category] || { seats: 4, bags: 2 };
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
