const User = require('../../models/User');
const Role = require('../../models/Role');
const Lead = require('../../models/Lead');
const Booking = require('../../models/Booking');
const FollowUp = require('../../models/FollowUp');
const Company = require('../models/Company');
const SuperAdmin = require('../models/SuperAdmin');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PlatformSettings = require('../models/PlatformSettings');
const PlatformNotification = require('../models/PlatformNotification');

async function ensureCompanyPrimaryDomainIndex() {
  try {
    const indexes = await Company.collection.indexes();
    const domainIdx = indexes.find((idx) => idx.key?.primaryDomain === 1);
    if (domainIdx && !domainIdx.sparse) {
      await Company.collection.dropIndex(domainIdx.name);
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[Indexes] primaryDomain index check:', err.message);
    }
  }

  await Company.updateMany(
    { primaryDomain: null },
    { $unset: { primaryDomain: '' } },
  );

  await Company.collection.createIndex(
    { primaryDomain: 1 },
    { unique: true, sparse: true, background: true, name: 'primaryDomain_1' },
  );
}

async function ensurePlatformIndexes() {
  await ensureCompanyPrimaryDomainIndex();
  await Promise.all([
    User.collection.createIndex({ companyId: 1, email: 1 }, { unique: true, background: true }),
    User.collection.createIndex({ companyId: 1, status: 1 }, { background: true }),
    Role.collection.createIndex({ companyId: 1, slug: 1 }, { unique: true, background: true }),
    Company.collection.createIndex({ slug: 1 }, { unique: true, background: true }),
    Company.collection.createIndex({ subdomain: 1 }, { unique: true, background: true }),
    Company.collection.createIndex({ status: 1, createdAt: -1 }, { background: true }),
    SuperAdmin.collection.createIndex({ email: 1 }, { unique: true, background: true }),
    SubscriptionPlan.collection.createIndex({ slug: 1 }, { unique: true, background: true }),
    PlatformSettings.collection.createIndex({ key: 1 }, { unique: true, background: true }),
    PlatformNotification.collection.createIndex({ read: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ companyId: 1, assignedTo: 1, status: 1 }, { background: true }),
    Booking.collection.createIndex({ companyId: 1, status: 1, createdAt: -1 }, { background: true }),
    FollowUp.collection.createIndex({ companyId: 1, status: 1, scheduledAt: 1 }, { background: true }),
  ]);

  // Website Management indexes (isolated website_* collections)
  try {
    const WebsiteTrek = require('../website/models/WebsiteTrek');
    const WebsiteLead = require('../website/models/WebsiteLead');
    const WebsiteBlog = require('../website/models/WebsiteBlog');
    const WebsiteMedia = require('../website/models/WebsiteMedia');
    await Promise.all([
      WebsiteTrek.collection.createIndex({ status: 1, sortOrder: 1, createdAt: -1 }, { background: true }),
      WebsiteTrek.collection.createIndex({ deletedAt: 1, status: 1 }, { background: true }),
      WebsiteLead.collection.createIndex({ type: 1, status: 1, createdAt: -1 }, { background: true }),
      WebsiteBlog.collection.createIndex({ status: 1, publishedAt: -1 }, { background: true }),
      WebsiteMedia.collection.createIndex({ folder: 1, createdAt: -1 }, { background: true }),
    ]);
  } catch (err) {
    console.warn('[Indexes] website indexes:', err.message);
  }
}

module.exports = { ensurePlatformIndexes };
