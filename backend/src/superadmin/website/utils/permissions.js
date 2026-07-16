const WEBSITE_MODULES = [
  'dashboard',
  'homepage',
  'treks',
  'destinations',
  'categories',
  'blogs',
  'media',
  'gallery',
  'testimonials',
  'faqs',
  'menus',
  'seo',
  'leads',
  'coupons',
  'settings',
  'redirects',
  'activity',
];

const WEBSITE_ACTIONS = ['view', 'create', 'edit', 'delete', 'publish', 'export'];

const DEFAULT_FULL_PERMISSIONS = WEBSITE_MODULES.reduce((acc, mod) => {
  acc[mod] = [...WEBSITE_ACTIONS];
  return acc;
}, {});

function normalizeWebsitePermissions(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FULL_PERMISSIONS };
  const out = {};
  for (const mod of WEBSITE_MODULES) {
    const actions = Array.isArray(raw[mod]) ? raw[mod] : WEBSITE_ACTIONS;
    out[mod] = WEBSITE_ACTIONS.filter((a) => actions.includes(a));
  }
  return out;
}

function hasWebsitePermission(actor, module, action) {
  if (!actor) return false;
  if (actor.role === 'super_admin') return true;
  const perms = normalizeWebsitePermissions(actor.websitePermissions);
  return (perms[module] || []).includes(action);
}

module.exports = {
  WEBSITE_MODULES,
  WEBSITE_ACTIONS,
  DEFAULT_FULL_PERMISSIONS,
  normalizeWebsitePermissions,
  hasWebsitePermission,
};
