export function formatHotelPrice(amount) {
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

export function countActiveHotelFilters(filters) {
  return Object.values(filters).filter((v) => v !== '' && v != null).length;
}

export function exportHotelsCsv(hotels = []) {
  const headers = ['Hotel', 'Category', 'Location', 'Room Type', 'Meal Plan', 'Price/Night', 'Status', 'ID'];
  const rows = hotels.map((h) => [
    h.name,
    h.category,
    h.location,
    h.displayRoomType,
    h.displayMealPlan,
    h.displayPrice,
    h.status,
    h.displayCode,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hotel-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const HOTEL_GRADIENTS = [
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-orange-400 to-amber-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-teal-500',
];

export function getHotelThumbClass(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HOTEL_GRADIENTS[Math.abs(hash) % HOTEL_GRADIENTS.length];
}
