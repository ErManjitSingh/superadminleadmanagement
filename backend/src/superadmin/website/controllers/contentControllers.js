const WebsiteTestimonial = require('../models/WebsiteTestimonial');
const WebsiteFaq = require('../models/WebsiteFaq');
const WebsiteGallery = require('../models/WebsiteGallery');
const WebsiteCoupon = require('../models/WebsiteCoupon');
const WebsiteRedirect = require('../models/WebsiteRedirect');
const { createCrudController } = require('../services/crudFactory');
const { baseDoc } = require('../utils/formatters');

function formatTestimonial(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    customerName: p.customerName,
    customerImage: p.customerImage || '',
    videoUrl: p.videoUrl || '',
    rating: p.rating,
    location: p.location || '',
    trekId: p.trekId || null,
    content: p.content,
    sortOrder: p.sortOrder || 0,
    isFeatured: !!p.isFeatured,
    status: p.status,
    enabled: p.enabled !== false,
  };
}

function formatFaq(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    question: p.question,
    answer: p.answer,
    category: p.category || 'general',
    trekId: p.trekId || null,
    sortOrder: p.sortOrder || 0,
    status: p.status,
    enabled: p.enabled !== false,
  };
}

function formatGallery(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    title: p.title,
    slug: p.slug,
    description: p.description || '',
    coverImage: p.coverImage || '',
    images: p.images || [],
    trekId: p.trekId || null,
    destinationId: p.destinationId || null,
    sortOrder: p.sortOrder || 0,
    status: p.status,
    enabled: p.enabled !== false,
  };
}

function formatCoupon(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    code: p.code,
    title: p.title || '',
    description: p.description || '',
    discountType: p.discountType,
    discountValue: p.discountValue,
    minAmount: p.minAmount || 0,
    maxDiscount: p.maxDiscount,
    usageLimit: p.usageLimit,
    usedCount: p.usedCount || 0,
    perUserLimit: p.perUserLimit || 1,
    applicableTrekIds: p.applicableTrekIds || [],
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    status: p.status,
    enabled: p.enabled !== false,
  };
}

function formatRedirect(doc) {
  const p = doc.toObject ? doc.toObject() : doc;
  return {
    ...baseDoc(p),
    fromPath: p.fromPath,
    toPath: p.toPath,
    type: p.type,
    hitCount: p.hitCount || 0,
    notes: p.notes || '',
    is404Handler: !!p.is404Handler,
    enabled: p.enabled !== false,
  };
}

const testimonials = createCrudController({
  Model: WebsiteTestimonial,
  resourceName: 'Testimonial',
  resourceType: 'testimonial',
  searchable: ['customerName', 'content', 'location'],
  allowedFields: [
    'customerName', 'customerImage', 'videoUrl', 'rating', 'location',
    'trekId', 'content', 'sortOrder', 'isFeatured', 'status', 'enabled',
  ],
  slugFrom: null,
  formatItem: formatTestimonial,
});

const faqs = createCrudController({
  Model: WebsiteFaq,
  resourceName: 'FAQ',
  resourceType: 'faq',
  searchable: ['question', 'answer', 'category'],
  allowedFields: ['question', 'answer', 'category', 'trekId', 'sortOrder', 'status', 'enabled'],
  slugFrom: null,
  formatItem: formatFaq,
});

const galleries = createCrudController({
  Model: WebsiteGallery,
  resourceName: 'Gallery',
  resourceType: 'gallery',
  searchable: ['title', 'description'],
  allowedFields: [
    'title', 'slug', 'description', 'coverImage', 'images',
    'trekId', 'destinationId', 'sortOrder', 'status', 'enabled',
  ],
  formatItem: formatGallery,
});

const coupons = createCrudController({
  Model: WebsiteCoupon,
  resourceName: 'Coupon',
  resourceType: 'coupon',
  searchable: ['code', 'title', 'description'],
  allowedFields: [
    'code', 'title', 'description', 'discountType', 'discountValue',
    'minAmount', 'maxDiscount', 'usageLimit', 'perUserLimit',
    'applicableTrekIds', 'startsAt', 'endsAt', 'status', 'enabled',
  ],
  slugFrom: null,
  formatItem: formatCoupon,
  supportsSort: false,
});

const redirects = createCrudController({
  Model: WebsiteRedirect,
  resourceName: 'Redirect',
  resourceType: 'redirect',
  searchable: ['fromPath', 'toPath', 'notes'],
  allowedFields: ['fromPath', 'toPath', 'type', 'notes', 'is404Handler', 'enabled'],
  slugFrom: null,
  formatItem: formatRedirect,
  supportsSort: false,
  supportsPublish: false,
});

module.exports = {
  listTestimonials: testimonials.list,
  getTestimonial: testimonials.getOne,
  createTestimonial: testimonials.create,
  updateTestimonial: testimonials.update,
  deleteTestimonial: testimonials.remove,
  reorderTestimonials: testimonials.reorder,

  listFaqs: faqs.list,
  getFaq: faqs.getOne,
  createFaq: faqs.create,
  updateFaq: faqs.update,
  deleteFaq: faqs.remove,
  reorderFaqs: faqs.reorder,

  listGalleries: galleries.list,
  getGallery: galleries.getOne,
  createGallery: galleries.create,
  updateGallery: galleries.update,
  deleteGallery: galleries.remove,
  reorderGalleries: galleries.reorder,

  listCoupons: coupons.list,
  getCoupon: coupons.getOne,
  createCoupon: coupons.create,
  updateCoupon: coupons.update,
  deleteCoupon: coupons.remove,

  listRedirects: redirects.list,
  getRedirect: redirects.getOne,
  createRedirect: redirects.create,
  updateRedirect: redirects.update,
  deleteRedirect: redirects.remove,
};
