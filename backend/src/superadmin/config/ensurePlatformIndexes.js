const User = require('../../models/User');
const Branch = require('../../models/Branch');
const Role = require('../../models/Role');
const Lead = require('../../models/Lead');
const Booking = require('../../models/Booking');
const FollowUp = require('../../models/FollowUp');
const Company = require('../models/Company');
const SuperAdmin = require('../models/SuperAdmin');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const PlatformSettings = require('../models/PlatformSettings');
const PlatformNotification = require('../models/PlatformNotification');

async function ensurePlatformIndexes() {
  await Promise.all([
    User.collection.createIndex({ companyId: 1, email: 1 }, { unique: true, background: true }),
    User.collection.createIndex({ companyId: 1, status: 1 }, { background: true }),
    Branch.collection.createIndex({ companyId: 1, code: 1 }, { unique: true, background: true }),
    Branch.collection.createIndex({ companyId: 1, name: 1 }, { unique: true, background: true }),
    Role.collection.createIndex({ companyId: 1, slug: 1 }, { unique: true, background: true }),
    Company.collection.createIndex({ slug: 1 }, { unique: true, background: true }),
    Company.collection.createIndex({ subdomain: 1 }, { unique: true, background: true }),
    Company.collection.createIndex({ primaryDomain: 1 }, { unique: true, sparse: true, background: true }),
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
}

module.exports = { ensurePlatformIndexes };
