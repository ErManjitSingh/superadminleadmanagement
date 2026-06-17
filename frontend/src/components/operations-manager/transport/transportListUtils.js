export function formatTransportPrice(amount) {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildSparkline(base, points = 8) {
  const n = Number(base) || 0;
  if (n <= 0) return Array(points).fill(0);
  return Array.from({ length: points }, (_, i) =>
    Math.round((n / points) * (0.55 + (i / points) * 0.95 + Math.sin(i * 0.8) * 0.1))
  );
}

export function countActiveTransportFilters(filters) {
  return Object.values(filters).filter((v) => v !== '' && v != null).length;
}

export function formatTransportDateTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function exportCabsCsv(cabs = []) {
  const headers = ['Vehicle', 'Type', 'Registration', 'Pickup', 'Drop', 'Capacity', 'Cost', 'Trip Type', 'Status'];
  const rows = cabs.map((c) => [
    c.displayName,
    c.displayType,
    c.displayRegistration,
    c.displayPickup,
    c.displayDrop,
    c.displayCapacity,
    c.displayCost,
    c.displayTripType,
    c.displayStatus,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transport-fleet-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportFlightsCsv(flights = []) {
  const headers = ['Airline', 'Flight', 'Departure', 'Arrival', 'Cost', 'Status'];
  const rows = flights.map((f) => [
    f.airline,
    f.flightNumber,
    f.departure,
    f.arrival,
    f.displayCost,
    f.displayStatus,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flight-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const VEHICLE_GRADIENTS = [
  'from-slate-400 to-slate-600',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-orange-400 to-amber-500',
];

export function getVehicleThumbClass(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return VEHICLE_GRADIENTS[Math.abs(hash) % VEHICLE_GRADIENTS.length];
}

export const CAB_STATUS_LABELS = {
  available: 'Available',
  on_trip: 'On Trip',
  maintenance: 'Maintenance',
  unavailable: 'Unavailable',
};
