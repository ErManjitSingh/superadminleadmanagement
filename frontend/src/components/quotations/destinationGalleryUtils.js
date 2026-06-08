/** Stock destination photos (Unsplash) — used when package has no custom gallery */
const DESTINATION_GALLERIES = {
  manali: [
    { url: 'https://images.unsplash.com/photo-1626621341517-bbf3c99e4460?w=900&q=80', label: 'Manali Valley' },
    { url: 'https://images.unsplash.com/photo-1595815778869-8465134C4C70?w=600&q=80', label: 'Solang Valley' },
    { url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80', label: 'Snow Peaks' },
    { url: 'https://images.unsplash.com/photo-1585508889437-1f1a9e2a5c3d?w=600&q=80', label: 'Kasol Riverside' },
  ],
  kasol: [
    { url: 'https://images.unsplash.com/photo-1585508889437-1f1a9e2a5c3d?w=900&q=80', label: 'Kasol Parvati Valley' },
    { url: 'https://images.unsplash.com/photo-1626621341517-bbf3c99e4460?w=600&q=80', label: 'Manali Hills' },
    { url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=600&q=80', label: 'Mountain Views' },
  ],
  kashmir: [
    { url: 'https://images.unsplash.com/photo-1595815778869-8465134C4C70?w=900&q=80', label: 'Dal Lake Srinagar' },
    { url: 'https://images.unsplash.com/photo-1585138771472-693abb640d77?w=600&q=80', label: 'Gulmarg Meadows' },
    { url: 'https://images.unsplash.com/photo-1609137144813-7d992133a583?w=600&q=80', label: 'Pahalgam Valley' },
    { url: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80', label: 'Mughal Gardens' },
  ],
  dubai: [
    { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80', label: 'Dubai Skyline' },
    { url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80', label: 'Burj Khalifa' },
    { url: 'https://images.unsplash.com/photo-1452780212940-6f903e5bb179?w=600&q=80', label: 'Desert Safari' },
    { url: 'https://images.unsplash.com/photo-1582672060013-985110837a78?w=600&q=80', label: 'Marina Cruise' },
  ],
  bali: [
    { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80', label: 'Bali Temple' },
    { url: 'https://images.unsplash.com/photo-1555404738-abb0f582a45c?w=600&q=80', label: 'Rice Terraces' },
    { url: 'https://images.unsplash.com/photo-1518548419970-58e310bfcb41?w=600&q=80', label: 'Seminyak Beach' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', label: 'Tropical Coast' },
  ],
  goa: [
    { url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80', label: 'Goa Beaches' },
    { url: 'https://images.unsplash.com/photo-1585138771472-693abb640d77?w=600&q=80', label: 'Coastal Sunset' },
    { url: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&q=80', label: 'Beach Paradise' },
  ],
  default: [
    { url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80', label: 'Scenic Destination' },
    { url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80', label: 'Road Trip Views' },
    { url: 'https://images.unsplash.com/photo-1476514525535-07fb3f4f431b?w=600&q=80', label: 'Lake & Mountains' },
    { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80', label: 'Nature Escape' },
  ],
};

function matchGalleryKey(text) {
  const t = String(text || '').toLowerCase();
  if (t.includes('manali') || t.includes('solang') || t.includes('kasol')) return 'manali';
  if (t.includes('kashmir') || t.includes('srinagar') || t.includes('gulmarg') || t.includes('pahalgam')) return 'kashmir';
  if (t.includes('dubai') || t.includes('uae')) return 'dubai';
  if (t.includes('bali') || t.includes('ubud') || t.includes('seminyak')) return 'bali';
  if (t.includes('goa')) return 'goa';
  if (t.includes('kasol')) return 'kasol';
  return 'default';
}

export function resolveDestinationImages(quote) {
  const pkg = quote?.package?.name
    ? (quote.package.destinationImages?.length ? quote.package : quote.packageSnapshot || quote.package)
    : quote?.packageSnapshot || quote?.package || {};

  if (pkg.destinationImages?.length) {
    return pkg.destinationImages.slice(0, 4).map((img, i) => ({
      url: typeof img === 'string' ? img : img.url,
      label: typeof img === 'string' ? `View ${i + 1}` : (img.label || img.caption || `View ${i + 1}`),
    }));
  }

  const searchText = [pkg.routing, pkg.destination, pkg.name].filter(Boolean).join(' ');
  const key = matchGalleryKey(searchText);

  if (pkg.coverImage) {
    const stock = DESTINATION_GALLERIES[key] || DESTINATION_GALLERIES.default;
    const hero = { url: pkg.coverImage, label: pkg.destination?.split(/[,·]/)[0]?.trim() || 'Your Destination' };
    const rest = stock.filter((s) => s.url !== pkg.coverImage).slice(0, 3);
    return [hero, ...rest];
  }

  return DESTINATION_GALLERIES[key] || DESTINATION_GALLERIES.default;
}
