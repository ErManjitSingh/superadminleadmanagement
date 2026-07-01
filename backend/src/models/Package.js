const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    meals: { type: String, default: '' },
    accommodation: { type: String, default: '' },
    hotel: { type: String, default: '' },
    activities: { type: String, default: '' },
    transport: { type: String, default: '' },
    images: [{ type: String }],
    notes: { type: String, default: '' },
    highlight: { type: Boolean, default: false },
    travelTime: { type: String, default: '' },
    distance: { type: String, default: '' },
    mapUrl: { type: String, default: '' },
  },
  { _id: true }
);

const packageHotelSchema = new mongoose.Schema(
  {
    day: { type: Number, default: 1 },
    name: { type: String, trim: true, default: '' },
    category: { type: String, default: '' },
    location: { type: String, default: '' },
    roomType: { type: String, default: '' },
    mealPlan: { type: String, default: '' },
    checkIn: { type: String, default: '' },
    checkOut: { type: String, default: '' },
    image: { type: String, default: '' },
    alternatives: [
      {
        name: String,
        category: String,
        roomType: String,
        mealPlan: String,
        image: String,
      },
    ],
  },
  { _id: true }
);

const transportItemSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'cab' },
    vehicle: { type: String, default: '' },
    pickup: { type: String, default: '' },
    drop: { type: String, default: '' },
    distance: { type: String, default: '' },
    driver: { type: String, default: '' },
    nightCharges: { type: Number, default: 0 },
    parking: { type: Number, default: 0 },
    toll: { type: Number, default: 0 },
    fuel: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const activityItemSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    description: { type: String, default: '' },
    duration: { type: String, default: '' },
    included: { type: Boolean, default: true },
    optional: { type: Boolean, default: false },
    extraCost: { type: Number, default: 0 },
    timing: { type: String, default: '' },
    image: { type: String, default: '' },
    day: { type: Number, default: 0 },
  },
  { _id: true }
);

const mealDaySchema = new mongoose.Schema(
  {
    day: { type: Number, default: 1 },
    breakfast: { type: String, default: '' },
    lunch: { type: String, default: '' },
    dinner: { type: String, default: '' },
    snacks: { type: String, default: '' },
    specialDinner: { type: String, default: '' },
  },
  { _id: true }
);

const pricingSchema = new mongoose.Schema(
  {
    hotelCost: { type: Number, default: 0 },
    cabCost: { type: Number, default: 0 },
    activityCost: { type: Number, default: 0 },
    mealCost: { type: Number, default: 0 },
    guideCost: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    markup: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    agentCommission: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },
    perPerson: { type: Number, default: 0 },
    doubleSharing: { type: Number, default: 0 },
    tripleSharing: { type: Number, default: 0 },
    quadSharing: { type: Number, default: 0 },
    childWithBed: { type: Number, default: 0 },
    childWithoutBed: { type: Number, default: 0 },
    infant: { type: Number, default: 0 },
  },
  { _id: false }
);

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: '' },
    destination: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'India' },
    duration: { type: Number, required: true, min: 1 },
    nights: { type: Number, default: 0 },
    days: { type: Number, default: 0 },
    startingCity: { type: String, trim: true, default: '' },
    endingCity: { type: String, trim: true, default: '' },
    bestTime: { type: String, trim: true, default: '' },
    difficulty: { type: String, enum: ['easy', 'moderate', 'challenging', ''], default: '' },
    packageCode: { type: String, trim: true, default: '' },
    shortDescription: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    startingPrice: { type: Number, default: 0 },
    packageType: {
      type: String,
      enum: ['honeymoon', 'family', 'group', 'adventure', 'luxury', 'corporate', 'weekend'],
      default: 'family',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'hidden', 'archived'],
      default: 'draft',
    },
    destinations: [destinationSchema],
    itinerary: [itineraryDaySchema],
    hotels: [packageHotelSchema],
    transport: [transportItemSchema],
    activities: [activityItemSchema],
    meals: [mealDaySchema],
    pricing: { type: pricingSchema, default: () => ({}) },
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    cancellationPolicy: {
      content: { type: String, default: '' },
      refundRules: { type: String, default: '' },
      slabs: [{ daysBefore: Number, refundPercent: Number }],
    },
    importantNotes: {
      travelGuidelines: { type: String, default: '' },
      documentsRequired: { type: String, default: '' },
      packingTips: { type: String, default: '' },
      weather: { type: String, default: '' },
      safety: { type: String, default: '' },
    },
    gallery: [{ type: String }],
    videos: [{ type: { type: String }, url: String, title: String }],
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' },
    },
    tags: [{ type: String }],
    features: {
      refundable: { type: Boolean, default: false },
      privateCab: { type: Boolean, default: false },
      guideIncluded: { type: Boolean, default: false },
      breakfast: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
      flights: { type: Boolean, default: false },
      visa: { type: Boolean, default: false },
      insurance: { type: Boolean, default: false },
    },
    analytics: {
      views: { type: Number, default: 0 },
      quotationCount: { type: Number, default: 0 },
      bookingCount: { type: Number, default: 0 },
      popularityScore: { type: Number, default: 0 },
    },
    versions: [
      {
        savedAt: { type: Date, default: Date.now },
        label: { type: String, default: '' },
        snapshot: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    source: { type: String, enum: ['local', 'template', 'duplicate'], default: 'local' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

packageSchema.index({ slug: 1 });
packageSchema.index({ status: 1, packageType: 1 });
packageSchema.index({ destination: 1 });

packageSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Package', packageSchema);
