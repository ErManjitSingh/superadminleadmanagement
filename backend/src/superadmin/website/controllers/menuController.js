const WebsiteMenu = require('../models/WebsiteMenu');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { baseDoc, applyAllowed } = require('../utils/formatters');
const { logWebsiteActivity } = require('../services/websiteActivityService');

const LOCATIONS = ['header', 'footer', 'mega', 'mobile', 'sidebar'];

function formatMenu(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    name: p.name,
    location: p.location,
    items: p.items || [],
    status: p.status,
    enabled: p.enabled !== false,
  };
}

async function ensureMenus() {
  for (const location of LOCATIONS) {
    const exists = await WebsiteMenu.findOne({ location });
    if (!exists) {
      await WebsiteMenu.create({
        name: `${location.charAt(0).toUpperCase()}${location.slice(1)} Menu`,
        location,
        items: [],
        status: 'published',
        enabled: true,
      });
    }
  }
}

const listMenus = asyncHandler(async (req, res) => {
  await ensureMenus();
  const items = await WebsiteMenu.find().sort({ location: 1 }).lean();
  res.json({ data: items.map(formatMenu) });
});

const getMenu = asyncHandler(async (req, res) => {
  await ensureMenus();
  const item = await WebsiteMenu.findOne({
    $or: [{ _id: req.params.id }, { location: req.params.id }],
  }).lean();
  if (!item) throw new ApiError(404, 'Menu not found');
  res.json({ menu: formatMenu(item) });
});

const updateMenu = asyncHandler(async (req, res) => {
  await ensureMenus();
  const item = await WebsiteMenu.findOne({
    $or: [{ _id: req.params.id }, { location: req.params.id }],
  });
  if (!item) throw new ApiError(404, 'Menu not found');

  applyAllowed(item, req.body, ['name', 'items', 'status', 'enabled']);
  item.updatedBy = req.superAdmin?._id;
  await item.save();

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'updated',
    resourceType: 'menu',
    resourceId: item._id,
    title: item.name,
    req,
  });

  res.json({ menu: formatMenu(item) });
});

module.exports = { listMenus, getMenu, updateMenu, formatMenu, LOCATIONS };
