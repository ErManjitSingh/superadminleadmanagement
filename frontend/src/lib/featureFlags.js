/**
 * Map sidebar nav items to tenant feature-flag keys.
 * If featureKey is set and company.features[featureKey] === false, item is hidden.
 */
export const NAV_FEATURE_MAP = {
  'lead-management': 'crm',
  'operations-management': 'bookings',
  '/quotations': 'crm',
  '/packages': 'packages',
  '/operations-manager/bookings/pending': 'bookings',
  payments: 'payments',
  '/email-activity': 'email',
  'reports-analytics': 'reports',
};

export function isFeatureEnabled(features, featureKey) {
  if (!featureKey) return true;
  if (!features || typeof features !== 'object') return true;
  return features[featureKey] !== false;
}

export function filterNavItemsByFeatures(items, features) {
  return items.reduce((acc, item) => {
    const itemKey = item.id || item.path;
    const featureKey = item.featureKey || NAV_FEATURE_MAP[itemKey];
    if (featureKey && !isFeatureEnabled(features, featureKey)) return acc;

    if (item.sections) {
      const sections = item.sections
        .map((section) => ({
          ...section,
          items: section.items.filter((child) => {
            const childFeature = child.featureKey || NAV_FEATURE_MAP[child.path];
            return isFeatureEnabled(features, childFeature);
          }),
        }))
        .filter((section) => section.items.length);
      if (!sections.length) return acc;
      acc.push({ ...item, sections });
      return acc;
    }

    if (item.children) {
      const children = item.children.filter((child) => {
        const childFeature = child.featureKey || NAV_FEATURE_MAP[child.path] || NAV_FEATURE_MAP[child.id];
        return isFeatureEnabled(features, childFeature);
      });
      if (!children.length) return acc;
      acc.push({ ...item, children });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
}
