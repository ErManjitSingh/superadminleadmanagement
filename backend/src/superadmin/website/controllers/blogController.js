const WebsiteBlog = require('../models/WebsiteBlog');
const { createCrudController } = require('../services/crudFactory');
const { pickSeo } = require('../utils/seoSchema');
const { baseDoc, applyAllowed } = require('../utils/formatters');
const asyncHandler = require('../../../utils/asyncHandler');
const ApiError = require('../../../utils/apiError');
const { logWebsiteActivity } = require('../services/websiteActivityService');

const ALLOWED = [
  'title', 'slug', 'excerpt', 'content', 'contentMarkdown', 'editorMode',
  'featuredImage', 'authorName', 'authorId', 'categoryIds', 'tags',
  'relatedPostIds', 'isFeatured', 'sortOrder', 'status', 'scheduledAt', 'enabled',
];

function formatBlog(doc, { includeRevisions = false } = {}) {
  const plain = doc.toObject ? doc.toObject() : doc;
  const out = {
    ...baseDoc(plain),
    title: plain.title,
    slug: plain.slug,
    excerpt: plain.excerpt || '',
    content: plain.content || '',
    contentMarkdown: plain.contentMarkdown || '',
    editorMode: plain.editorMode || 'richtext',
    featuredImage: plain.featuredImage || '',
    authorName: plain.authorName || '',
    authorId: plain.authorId || null,
    categoryIds: plain.categoryIds || [],
    tags: plain.tags || [],
    relatedPostIds: plain.relatedPostIds || [],
    isFeatured: !!plain.isFeatured,
    sortOrder: plain.sortOrder || 0,
    status: plain.status,
    publishedAt: plain.publishedAt,
    scheduledAt: plain.scheduledAt,
    lastAutoSavedAt: plain.lastAutoSavedAt,
    viewCount: plain.viewCount || 0,
    enabled: plain.enabled !== false,
    ...pickSeo(plain),
  };
  if (includeRevisions) {
    out.revisions = (plain.revisions || []).slice(-20).map((r) => ({
      id: r._id,
      title: r.title,
      excerpt: r.excerpt,
      savedAt: r.savedAt,
      savedBy: r.savedBy,
    }));
  }
  return out;
}

const crud = createCrudController({
  Model: WebsiteBlog,
  resourceName: 'Blog',
  resourceType: 'blog',
  searchable: ['title', 'excerpt', 'tags'],
  allowedFields: ALLOWED,
  formatItem: (doc) => formatBlog(doc),
  supportsDuplicate: true,
  includeSeo: true,
});

const getBlog = asyncHandler(async (req, res) => {
  const item = await WebsiteBlog.findOne({ _id: req.params.id, deletedAt: null }).lean();
  if (!item) throw new ApiError(404, 'Blog not found');
  res.json({ blog: formatBlog(item, { includeRevisions: true }) });
});

const autoSave = asyncHandler(async (req, res) => {
  const item = await WebsiteBlog.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Blog not found');

  applyAllowed(item, req.body, ['title', 'excerpt', 'content', 'contentMarkdown', 'editorMode', 'featuredImage', 'tags']);
  item.lastAutoSavedAt = new Date();
  item.updatedBy = req.superAdmin?._id;

  if (req.body.createRevision) {
    item.revisions.push({
      title: item.title,
      content: item.content,
      contentMarkdown: item.contentMarkdown,
      excerpt: item.excerpt,
      savedAt: new Date(),
      savedBy: req.superAdmin?._id,
    });
    if (item.revisions.length > 50) {
      item.revisions = item.revisions.slice(-50);
    }
  }

  await item.save();
  res.json({ blog: formatBlog(item, { includeRevisions: true }) });
});

const restoreRevision = asyncHandler(async (req, res) => {
  const item = await WebsiteBlog.findOne({ _id: req.params.id, deletedAt: null });
  if (!item) throw new ApiError(404, 'Blog not found');
  const revision = item.revisions.id(req.params.revisionId);
  if (!revision) throw new ApiError(404, 'Revision not found');

  item.revisions.push({
    title: item.title,
    content: item.content,
    contentMarkdown: item.contentMarkdown,
    excerpt: item.excerpt,
    savedAt: new Date(),
    savedBy: req.superAdmin?._id,
  });

  item.title = revision.title || item.title;
  item.content = revision.content || '';
  item.contentMarkdown = revision.contentMarkdown || '';
  item.excerpt = revision.excerpt || '';
  item.updatedBy = req.superAdmin?._id;
  await item.save();

  await logWebsiteActivity({
    actor: req.superAdmin,
    action: 'updated',
    resourceType: 'blog',
    resourceId: item._id,
    title: item.title,
    metadata: { restoredRevision: req.params.revisionId },
    req,
  });

  res.json({ blog: formatBlog(item, { includeRevisions: true }) });
});

module.exports = {
  listBlogs: crud.list,
  getBlog,
  createBlog: crud.create,
  updateBlog: crud.update,
  deleteBlog: crud.remove,
  reorderBlogs: crud.reorder,
  duplicateBlog: crud.duplicate,
  autoSaveBlog: autoSave,
  restoreBlogRevision: restoreRevision,
  formatBlog,
};
