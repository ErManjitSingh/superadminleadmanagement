const WebsiteCategory = require('../models/WebsiteCategory');
const { createCrudController } = require('../services/crudFactory');
const { pickSeo } = require('../utils/seoSchema');
const { baseDoc } = require('../utils/formatters');

const ALLOWED = [
  'title', 'slug', 'description', 'image', 'banner', 'parentId',
  'type', 'sortOrder', 'status', 'enabled',
];

function formatCategory(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(plain),
    title: plain.title,
    slug: plain.slug,
    description: plain.description || '',
    image: plain.image || '',
    banner: plain.banner || '',
    parentId: plain.parentId || null,
    type: plain.type,
    sortOrder: plain.sortOrder || 0,
    status: plain.status,
    enabled: plain.enabled !== false,
    ...pickSeo(plain),
  };
}

const crud = createCrudController({
  Model: WebsiteCategory,
  resourceName: 'Category',
  resourceType: 'category',
  searchable: ['title', 'description'],
  allowedFields: ALLOWED,
  formatItem: formatCategory,
  includeSeo: true,
});

module.exports = {
  listCategories: crud.list,
  getCategory: crud.getOne,
  createCategory: crud.create,
  updateCategory: crud.update,
  deleteCategory: crud.remove,
  reorderCategories: crud.reorder,
  formatCategory,
};
