const ApiError = require('../../../utils/apiError');
const asyncHandler = require('../../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../../utils/pagination');
const { uniqueSlug, slugify } = require('../utils/slugify');
const { applyAllowed, baseDoc } = require('../utils/formatters');
const { pickSeo, SEO_KEYS } = require('../utils/seoSchema');
const { logWebsiteActivity } = require('../services/websiteActivityService');

function createCrudController({
  Model,
  resourceName,
  resourceType,
  searchable = ['title'],
  allowedFields = [],
  slugFrom = 'title',
  formatItem,
  softDelete = true,
  supportsPublish = true,
  supportsDuplicate = false,
  supportsSort = true,
  includeSeo = false,
}) {
  const fields = includeSeo ? [...new Set([...allowedFields, ...SEO_KEYS])] : allowedFields;

  const format = formatItem || ((doc) => {
    const plain = doc.toObject ? doc.toObject() : doc;
    const out = {
      ...baseDoc(plain),
      ...Object.fromEntries(fields.map((k) => [k, plain[k]]).filter(([, v]) => v !== undefined)),
      status: plain.status,
      enabled: plain.enabled,
      sortOrder: plain.sortOrder,
      publishedAt: plain.publishedAt,
      scheduledAt: plain.scheduledAt,
    };
    if (includeSeo) Object.assign(out, pickSeo(plain));
    if (plain.slug !== undefined) out.slug = plain.slug;
    if (plain.title !== undefined) out.title = plain.title;
    return out;
  });

  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const filter = softDelete ? { deletedAt: null } : {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.enabled !== undefined) filter.enabled = req.query.enabled === 'true';
    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.folder) filter.folder = req.query.folder;
    if (req.query.q) {
      const regex = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = searchable.map((field) => ({ [field]: regex }));
    }

    const sort = req.query.sort === 'sortOrder'
      ? { sortOrder: 1, createdAt: -1 }
      : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);

    res.json(paginatedResponse(items.map(format), { page, limit, total }));
  });

  const getOne = asyncHandler(async (req, res) => {
    const filter = softDelete
      ? { _id: req.params.id, deletedAt: null }
      : { _id: req.params.id };
    const item = await Model.findOne(filter).lean();
    if (!item) throw new ApiError(404, `${resourceName} not found`);
    res.json({ [resourceType]: format(item) });
  });

  const create = asyncHandler(async (req, res) => {
    const payload = {};
    applyAllowed(payload, req.body, fields);

    if (slugFrom && (Model.schema.path('slug'))) {
      const base = req.body.slug || req.body[slugFrom] || resourceName;
      payload.slug = await uniqueSlug(Model, base);
    }

    if (req.superAdmin?._id) {
      if (Model.schema.path('createdBy')) payload.createdBy = req.superAdmin._id;
      if (Model.schema.path('updatedBy')) payload.updatedBy = req.superAdmin._id;
    }

    if (supportsPublish && payload.status === 'published' && Model.schema.path('publishedAt')) {
      payload.publishedAt = new Date();
    }

    const item = await Model.create(payload);

    await logWebsiteActivity({
      actor: req.superAdmin,
      action: 'created',
      resourceType,
      resourceId: item._id,
      title: item.title || item.name || item.code || item.question || resourceName,
      req,
    });

    res.status(201).json({ [resourceType]: format(item) });
  });

  const update = asyncHandler(async (req, res) => {
    const filter = softDelete
      ? { _id: req.params.id, deletedAt: null }
      : { _id: req.params.id };
    const item = await Model.findOne(filter);
    if (!item) throw new ApiError(404, `${resourceName} not found`);

    applyAllowed(item, req.body, fields);

    if (req.body.slug && Model.schema.path('slug') && req.body.slug !== item.slug) {
      item.slug = await uniqueSlug(Model, req.body.slug, item._id);
    } else if (slugFrom && req.body[slugFrom] && !req.body.slug && Model.schema.path('slug')) {
      // keep existing slug unless explicitly changed
    }

    if (req.superAdmin?._id && Model.schema.path('updatedBy')) {
      item.updatedBy = req.superAdmin._id;
    }

    if (supportsPublish && req.body.status === 'published' && !item.publishedAt && Model.schema.path('publishedAt')) {
      item.publishedAt = new Date();
      await logWebsiteActivity({
        actor: req.superAdmin,
        action: 'published',
        resourceType,
        resourceId: item._id,
        title: item.title || item.name || resourceName,
        req,
      });
    }

    await item.save();

    await logWebsiteActivity({
      actor: req.superAdmin,
      action: 'updated',
      resourceType,
      resourceId: item._id,
      title: item.title || item.name || item.code || item.question || resourceName,
      req,
    });

    res.json({ [resourceType]: format(item) });
  });

  const remove = asyncHandler(async (req, res) => {
    const filter = softDelete
      ? { _id: req.params.id, deletedAt: null }
      : { _id: req.params.id };
    const item = await Model.findOne(filter);
    if (!item) throw new ApiError(404, `${resourceName} not found`);

    if (softDelete) {
      item.deletedAt = new Date();
      if (Model.schema.path('status')) item.status = 'archived';
      await item.save();
    } else {
      await item.deleteOne();
    }

    await logWebsiteActivity({
      actor: req.superAdmin,
      action: 'deleted',
      resourceType,
      resourceId: item._id,
      title: item.title || item.name || item.code || item.question || resourceName,
      req,
    });

    res.json({ message: 'Deleted' });
  });

  const reorder = supportsSort
    ? asyncHandler(async (req, res) => {
      const orders = Array.isArray(req.body?.orders) ? req.body.orders : [];
      if (!orders.length) throw new ApiError(400, 'orders array is required');

      await Promise.all(
        orders.map(({ id, sortOrder }) =>
          Model.updateOne(
            softDelete ? { _id: id, deletedAt: null } : { _id: id },
            { $set: { sortOrder: Number(sortOrder) || 0 } },
          ),
        ),
      );

      await logWebsiteActivity({
        actor: req.superAdmin,
        action: 'sorted',
        resourceType,
        title: `Reordered ${resourceName}`,
        metadata: { count: orders.length },
        req,
      });

      res.json({ message: 'Sorted' });
    })
    : null;

  const duplicate = supportsDuplicate
    ? asyncHandler(async (req, res) => {
      const filter = softDelete
        ? { _id: req.params.id, deletedAt: null }
        : { _id: req.params.id };
      const source = await Model.findOne(filter).lean();
      if (!source) throw new ApiError(404, `${resourceName} not found`);

      const copy = { ...source };
      delete copy._id;
      delete copy.createdAt;
      delete copy.updatedAt;
      delete copy.__v;
      copy.status = 'draft';
      copy.publishedAt = null;
      copy.title = `${source.title || resourceName} (Copy)`;
      if (source.slug) copy.slug = await uniqueSlug(Model, `${source.slug}-copy`);
      if (req.superAdmin?._id) {
        copy.createdBy = req.superAdmin._id;
        copy.updatedBy = req.superAdmin._id;
      }

      const item = await Model.create(copy);

      await logWebsiteActivity({
        actor: req.superAdmin,
        action: 'duplicated',
        resourceType,
        resourceId: item._id,
        title: item.title,
        metadata: { fromId: source._id },
        req,
      });

      res.status(201).json({ [resourceType]: format(item) });
    })
    : null;

  return {
    list,
    getOne,
    create,
    update,
    remove,
    reorder,
    duplicate,
    format,
    fields,
    slugify,
  };
}

module.exports = { createCrudController };
