const WebsiteDestination = require('../models/WebsiteDestination');
const { createCrudController } = require('../services/crudFactory');
const { pickSeo } = require('../utils/seoSchema');
const { baseDoc } = require('../utils/formatters');

const ALLOWED = [
  'title', 'slug', 'region', 'state', 'country', 'overview', 'travelGuide',
  'gallery', 'featuredImage', 'bannerImage', 'weather', 'nearbyPlaces',
  'transport', 'isFeatured', 'sortOrder', 'status', 'enabled',
];

function formatDestination(doc) {
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(plain),
    title: plain.title,
    slug: plain.slug,
    region: plain.region,
    state: plain.state,
    country: plain.country,
    overview: plain.overview,
    travelGuide: plain.travelGuide,
    gallery: plain.gallery || [],
    featuredImage: plain.featuredImage || '',
    bannerImage: plain.bannerImage || '',
    weather: plain.weather || {},
    nearbyPlaces: plain.nearbyPlaces || [],
    transport: plain.transport || {},
    isFeatured: !!plain.isFeatured,
    sortOrder: plain.sortOrder || 0,
    status: plain.status,
    publishedAt: plain.publishedAt,
    enabled: plain.enabled !== false,
    viewCount: plain.viewCount || 0,
    ...pickSeo(plain),
  };
}

const crud = createCrudController({
  Model: WebsiteDestination,
  resourceName: 'Destination',
  resourceType: 'destination',
  searchable: ['title', 'region', 'state'],
  allowedFields: ALLOWED,
  formatItem: formatDestination,
  supportsDuplicate: true,
  includeSeo: true,
});

module.exports = {
  listDestinations: crud.list,
  getDestination: crud.getOne,
  createDestination: crud.create,
  updateDestination: crud.update,
  deleteDestination: crud.remove,
  reorderDestinations: crud.reorder,
  duplicateDestination: crud.duplicate,
  formatDestination,
};
