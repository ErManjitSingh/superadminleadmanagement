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

export const ROOM_TYPES = ['Standard', 'Deluxe', 'Super Deluxe', 'Luxury', 'Premium', 'Suite'];

export const VEHICLE_COUNT_OPTIONS = [1, 2, 3, 4, 5];

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
