const User = require('../models/User');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');
const LeadActivity = require('../models/LeadActivity');
const AuditLog = require('../models/AuditLog');

async function ensureIndexes() {
  await Promise.all([
    User.collection.createIndex({ email: 1 }, { unique: true, background: true }),
    Branch.collection.createIndex({ code: 1 }, { unique: true, background: true }),
    User.collection.createIndex({ role: 1, status: 1 }, { background: true }),
    User.collection.createIndex({ branchId: 1, role: 1, status: 1 }, { background: true }),

    Lead.collection.createIndex({ phone: 1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, status: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, leadScore: 1, budget: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, 'reactivation.isReactivated': 1, 'reactivation.stage': 1, updatedAt: -1 }, { background: true }),
    Lead.collection.createIndex({ status: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ assignedTo: 1, status: 1 }, { background: true }),
    Lead.collection.createIndex({ destination: 1 }, { background: true }),
    Lead.collection.createIndex({ createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ name: 'text', email: 'text', destination: 'text' }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, isDeleted: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, temperature: 1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, agingBucket: 1 }, { background: true }),
    Lead.collection.createIndex({ alternatePhone: 1 }, { background: true, sparse: true }),
    LeadActivity.collection.createIndex({ leadId: 1, createdAt: -1 }, { background: true }),
    AuditLog.collection.createIndex({ entityType: 1, entityId: 1, createdAt: -1 }, { background: true }),

    FollowUp.collection.createIndex({ scheduledAt: 1, status: 1 }, { background: true }),
    FollowUp.collection.createIndex({ branchId: 1, status: 1, scheduledAt: 1 }, { background: true }),
    FollowUp.collection.createIndex({ lead: 1, scheduledAt: -1 }, { background: true }),
    FollowUp.collection.createIndex({ assignedTo: 1, status: 1, scheduledAt: 1 }, { background: true }),

    Quotation.collection.createIndex({ lead: 1, status: 1 }, { background: true }),
    Quotation.collection.createIndex({ branchId: 1, status: 1, createdAt: -1 }, { background: true }),
    Quotation.collection.createIndex({ status: 1, createdAt: -1 }, { background: true }),

    Booking.collection.createIndex({ travelDate: 1, status: 1 }, { background: true }),
    Booking.collection.createIndex({ branchId: 1, status: 1, createdAt: -1 }, { background: true }),
    Booking.collection.createIndex({ status: 1, createdAt: -1 }, { background: true }),

    Attendance.collection.createIndex({ userId: 1, date: 1 }, { unique: true, background: true }),
    ActivityLog.collection.createIndex({ branchId: 1, createdAt: -1 }, { background: true }),
    ActivityLog.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400, background: true }),
    Attendance.collection.createIndex({ date: 1, workMode: 1 }, { background: true }),
    Attendance.collection.createIndex({ date: 1, status: 1 }, { background: true }),
  ]);

  console.log('[MongoDB] Performance indexes ensured');
}

module.exports = { ensureIndexes };
