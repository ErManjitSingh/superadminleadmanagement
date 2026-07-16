const mongoose = require('mongoose');
const { seoFields } = require('../utils/seoSchema');

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    meals: { type: String, default: '' },
    accommodation: { type: String, default: '' },
    altitude: { type: String, default: '' },
  },
  { _id: false },
);

const departureSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    seats: { type: Number, default: 0 },
    price: { type: Number, default: null },
    status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' },
  },
  { _id: true },
);

const pricingSchema = new mongoose.Schema(
  {
    basePrice: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxInclusive: { type: Boolean, default: true },
  },
  { _id: false },
);

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const websiteTrekSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    location: { type: String, default: '', trim: true },
    region: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    duration: { type: String, default: '', trim: true },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'difficult', 'challenging', 'extreme'],
      default: 'moderate',
      index: true,
    },
    altitude: { type: String, default: '' },
    distance: { type: String, default: '' },
    overview: { type: String, default: '' },
    highlights: [{ type: String }],
    itinerary: [itineraryDaySchema],
    gallery: [{ type: String }],
    videos: [{ type: String }],
    featuredImage: { type: String, default: '' },
    bestTime: { type: String, default: '' },
    fitness: { type: String, default: '' },
    packingList: [{ type: String }],
    thingsToCarry: [{ type: String }],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    departureDates: [departureSchema],
    pricing: { type: pricingSchema, default: () => ({}) },
    groupSize: {
      min: { type: Number, default: 1 },
      max: { type: Number, default: 20 },
    },
    faqs: [faqItemSchema],
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteCategory' }],
    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteDestination', default: null },
    relatedTrekIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteTrek' }],
    isFeatured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'scheduled'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    deletedAt: { type: Date, default: null },
    ...seoFields,
  },
  { timestamps: true, collection: 'website_treks' },
);

websiteTrekSchema.index({ title: 'text', overview: 'text', location: 'text' });
websiteTrekSchema.index({ status: 1, sortOrder: 1, createdAt: -1 });
websiteTrekSchema.index({ deletedAt: 1, status: 1 });

websiteTrekSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('WebsiteTrek', websiteTrekSchema);
