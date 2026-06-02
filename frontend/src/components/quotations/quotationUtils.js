export function calculatePricing({ baseCost = 0, hotelCost = 0, cabCost = 0, flightCost = 0, activityCost = 0, taxes = 0, markup = 0, discount = 0 }) {
  const subtotal = Number(baseCost) + Number(hotelCost) + Number(cabCost) + Number(flightCost) + Number(activityCost) + Number(taxes);
  const total = subtotal + Number(markup) - Number(discount);
  const costBeforeMarkup = subtotal;
  const profit = Number(markup) - Number(discount);
  const profitMargin = costBeforeMarkup > 0 ? Math.round((profit / total) * 1000) / 10 : 0;
  return { subtotal, total: Math.max(0, total), profitMargin };
}

export function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export function getPackageTypeConfig(type) {
  const types = {
    honeymoon: { label: 'Honeymoon', color: 'rose' },
    family: { label: 'Family', color: 'sky' },
    group: { label: 'Group', color: 'violet' },
    adventure: { label: 'Adventure', color: 'emerald' },
    luxury: { label: 'Luxury', color: 'amber' },
    corporate: { label: 'Corporate', color: 'slate' },
  };
  return types[type] || { label: type, color: 'brand' };
}

export function defaultItineraryDay(day, destination) {
  return {
    id: `day-${Date.now()}-${day}`,
    day,
    title: day === 1 ? `Arrival in ${destination}` : `Day ${day} in ${destination}`,
    description: '',
    hotel: '',
    activities: '',
    meals: 'Breakfast',
    transport: 'Private Cab',
  };
}

export const defaultPricing = {
  baseCost: 0,
  hotelCost: 0,
  cabCost: 0,
  flightCost: 0,
  activityCost: 0,
  taxes: 0,
  markup: 0,
  discount: 0,
  total: 0,
  profitMargin: 0,
};

export const defaultWizardState = {
  leadId: '',
  packageId: '',
  customizations: '',
  selectedHotelIds: [],
  selectedCabIds: [],
  selectedFlightIds: [],
  selectedActivityIds: [],
  pricing: { ...defaultPricing },
};
