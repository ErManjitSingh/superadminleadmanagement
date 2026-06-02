function getByPath(obj, path) {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function applyToItem(item, counts) {
  if (!item) return item;
  const next = { ...item };

  if (item.countKey) {
    const value = getByPath(counts, item.countKey);
    if (typeof value === 'number') next.count = value;
    else delete next.count;
  }

  if (item.badgeKey) {
    const value = getByPath(counts, item.badgeKey);
    if (typeof value === 'number') next.badge = value;
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
