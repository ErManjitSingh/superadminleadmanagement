function getByPath(obj, path) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function toCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function applyToItem(item, counts) {
  if (!item) return item;
  const next = { ...item };

  if (item.countKey) {
    const value = toCount(getByPath(counts, item.countKey));
    if (value !== undefined) next.count = value;
    else delete next.count;
  }

  if (item.badgeKey) {
    const value = toCount(getByPath(counts, item.badgeKey));
    if (value !== undefined) next.badge = value;
    else delete next.badge;
  }

  if (item.children) {
    next.children = item.children.map((child) => applyToItem(child, counts));
  }

  return next;
}

/** Merge API nav counts into sidebar config items (by countKey / badgeKey). */
export function applySidebarCounts(items, counts) {
  if (!counts || !items?.length) return items;
  return items.map((item) => applyToItem(item, counts));
}
