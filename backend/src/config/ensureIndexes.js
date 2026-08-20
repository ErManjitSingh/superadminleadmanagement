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
const CallNote = require('../models/CallNote');
const LeadEscalation = require('../models/LeadEscalation');
const LeadMergeLog = require('../models/LeadMergeLog');
const LeadTransferLog = require('../models/LeadTransferLog');
const LeadNote = require('../models/LeadNote');
const EmailLog = require('../models/EmailLog');
const EmailReply = require('../models/EmailReply');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const TripTask = require('../models/TripTask');
const TripDocument = require('../models/TripDocument');
const SupportTicket = require('../models/SupportTicket');
const Voucher = require('../models/Voucher');

async function dropLegacyBranchIndexes() {
  try {
    const indexes = await Branch.collection.indexes();
    for (const idx of indexes) {
      const keys = idx.key || {};
      if (keys.code === 1 && keys.companyId == null) {
        await Branch.collection.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped legacy branch index: ${idx.name}`);
      }
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[MongoDB] Legacy branch index cleanup:', err.message);
    }
  }
}

// A global unique index on { leadId } blocks every tenant from using L-0030
// if any other company in the same DB already has it. IDs are per-company.
async function dropLegacyLeadIdIndex() {
  try {
    const indexes = await Lead.collection.indexes();
    for (const idx of indexes) {
      const keys = idx.key || {};
      if (keys.leadId === 1 && Object.keys(keys).length === 1) {
        await Lead.collection.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped legacy global leadId index: ${idx.name}`);
      }
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[MongoDB] Legacy leadId index cleanup:', err.message);
    }
  }
}

// A global unique index on { email } breaks multi-tenancy: two companies could
// never share an owner/user email, and provisioning would silently fail and
// leave orphaned companies. Drop it in favour of the compound
// { companyId: 1, email: 1 } unique index.
async function dropLegacyUserEmailIndex() {
  try {
    const indexes = await User.collection.indexes();
    for (const idx of indexes) {
      const keys = idx.key || {};
      if (keys.email === 1 && Object.keys(keys).length === 1) {
        await User.collection.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped legacy global user email index: ${idx.name}`);
      }
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[MongoDB] Legacy user email index cleanup:', err.message);
    }
  }
}

const TENANT_LEAD_ID_INDEX = {
  unique: true,
  name: 'companyId_1_leadId_1',
  background: true,
  partialFilterExpression: {
    companyId: { $type: 'objectId' },
    leadId: { $type: 'string' },
  },
};

async function createIndexSafe(label, collection, spec, options) {
  try {
    await collection.createIndex(spec, options);
  } catch (err) {
    console.warn(`[MongoDB] ${label}: ${err.message}`);
  }
}

// sparse unique still indexes explicit nulls, so leftover { companyId: null, leadId: null }
// rows crash API boot. Partial filter only unique-indexes real tenant lead IDs.
async function ensureTenantLeadIdIndex() {
  try {
    const indexes = await Lead.collection.indexes();
    for (const idx of indexes) {
      const keys = idx.key || {};
      const isCompoundLeadId = keys.companyId === 1 && keys.leadId === 1 && Object.keys(keys).length === 2;
      if (!isCompoundLeadId) continue;
      if (!idx.partialFilterExpression) {
        await Lead.collection.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped incompatible lead unique index: ${idx.name}`);
      }
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[MongoDB] Tenant leadId index cleanup:', err.message);
    }
  }

  await createIndexSafe(
    'leads.companyId_1_leadId_1',
    Lead.collection,
    { companyId: 1, leadId: 1 },
    TENANT_LEAD_ID_INDEX,
  );
}

// Global unique on { bookingNumber } blocks multi-tenant numbering and retries
// after a partial convert (same BK-2026-0024 generated twice).
async function dropLegacyBookingNumberIndex() {
  try {
    const indexes = await Booking.collection.indexes();
    for (const idx of indexes) {
      const keys = idx.key || {};
      if (keys.bookingNumber === 1 && Object.keys(keys).length === 1) {
        await Booking.collection.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped legacy global bookingNumber index: ${idx.name}`);
      }
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[MongoDB] Legacy bookingNumber index cleanup:', err.message);
    }
  }
}

const TENANT_BOOKING_NUMBER_INDEX = {
  unique: true,
  name: 'companyId_1_bookingNumber_1',
  background: true,
  partialFilterExpression: {
    companyId: { $type: 'objectId' },
    bookingNumber: { $type: 'string' },
  },
};

async function ensureTenantBookingNumberIndex() {
  try {
    const indexes = await Booking.collection.indexes();
    for (const idx of indexes) {
      const keys = idx.key || {};
      const isCompound = keys.companyId === 1 && keys.bookingNumber === 1 && Object.keys(keys).length === 2;
      if (!isCompound) continue;
      if (!idx.partialFilterExpression) {
        await Booking.collection.dropIndex(idx.name);
        console.log(`[MongoDB] Dropped incompatible booking unique index: ${idx.name}`);
      }
    }
  } catch (err) {
    if (err?.code !== 27) {
      console.warn('[MongoDB] Tenant bookingNumber index cleanup:', err.message);
    }
  }

  await createIndexSafe(
    'bookings.companyId_1_bookingNumber_1',
    Booking.collection,
    { companyId: 1, bookingNumber: 1 },
    TENANT_BOOKING_NUMBER_INDEX,
  );
}

async function ensureIndexes() {
  try {
    await dropLegacyBranchIndexes();
    await dropLegacyUserEmailIndex();
    await dropLegacyLeadIdIndex();
    await ensureTenantLeadIdIndex();
    await dropLegacyBookingNumberIndex();
    await ensureTenantBookingNumberIndex();
  } catch (err) {
    console.error('[MongoDB] Legacy index cleanup failed (API will still start):', err.message);
  }

  const indexJobs = [
    createIndexSafe('users.companyId_email', User.collection, { companyId: 1, email: 1 }, { unique: true, background: true }),
    createIndexSafe('users.role_status', User.collection, { role: 1, status: 1 }, { background: true }),
    createIndexSafe('users.branch_role_status', User.collection, { branchId: 1, role: 1, status: 1 }, { background: true }),

    createIndexSafe('leads.phone', Lead.collection, { phone: 1 }, { background: true }),
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
    Lead.collection.createIndex({ branchId: 1, isDeleted: 1, status: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, isDeleted: 1, assignedTo: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, isDeleted: 1, source: 1, status: 1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, slaBreached: 1, createdAt: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, assignedTo: 1, status: 1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, assignedTo: 1, isHot: 1, status: 1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, channel: 1, updatedAt: -1 }, { background: true }),
    Lead.collection.createIndex({ budget: -1 }, { background: true }),
    Lead.collection.createIndex({ branchId: 1, isDeleted: 1, budget: -1 }, { background: true }),
    Lead.collection.createIndex({ nextFollowUp: 1 }, { background: true, sparse: true }),
    Lead.collection.createIndex({ branchId: 1, isDeleted: 1, nextFollowUp: 1 }, { background: true, sparse: true }),
    Lead.collection.createIndex({ email: 1 }, { background: true, sparse: true }),
    LeadNote.collection.createIndex({ lead: 1, createdAt: -1 }, { background: true }),
    LeadActivity.collection.createIndex({ leadId: 1, createdAt: -1 }, { background: true }),
    AuditLog.collection.createIndex({ entityType: 1, entityId: 1, createdAt: -1 }, { background: true }),
    CallNote.collection.createIndex({ leadId: 1, createdAt: -1 }, { background: true }),
    LeadEscalation.collection.createIndex({ followUpId: 1, level: 1 }, { unique: true, background: true }),
    LeadMergeLog.collection.createIndex({ targetLeadId: 1, createdAt: -1 }, { background: true }),
    LeadTransferLog.collection.createIndex({ leadId: 1, createdAt: -1 }, { background: true }),

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
    Booking.collection.createIndex({ branchId: 1, status: 1, travelDate: 1 }, { background: true }),
    Booking.collection.createIndex({ branchId: 1, archivedAt: 1, createdAt: -1 }, { background: true }),
    TripTask.collection.createIndex({ booking: 1, status: 1 }, { background: true }),
    TripTask.collection.createIndex({ branchId: 1, status: 1, dueDate: 1 }, { background: true }),
    TripDocument.collection.createIndex({ booking: 1, type: 1 }, { background: true }),
    SupportTicket.collection.createIndex({ status: 1, updatedAt: -1 }, { background: true }),
    Voucher.collection.createIndex({ booking: 1, type: 1 }, { background: true }),

    Attendance.collection.createIndex({ userId: 1, date: 1 }, { unique: true, background: true }),
    ActivityLog.collection.createIndex({ branchId: 1, createdAt: -1 }, { background: true }),
    ActivityLog.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400, background: true }),
    Attendance.collection.createIndex({ date: 1, workMode: 1 }, { background: true }),
    Attendance.collection.createIndex({ date: 1, status: 1 }, { background: true }),

    EmailLog.collection.createIndex({ branchId: 1, leadId: 1, status: 1, sentAt: -1 }, { background: true }),
    EmailLog.collection.createIndex({ branchId: 1, sentBy: 1, status: 1, sentAt: -1 }, { background: true }),
    EmailLog.collection.createIndex({ branchId: 1, status: 1, sentAt: -1 }, { background: true }),
    EmailLog.collection.createIndex({ branchId: 1, status: 1, createdAt: -1 }, { background: true }),
    EmailReply.collection.createIndex({ branchId: 1, leadId: 1, receivedAt: -1 }, { background: true }),
    EmailReply.collection.createIndex({ branchId: 1, receivedAt: -1 }, { background: true }),
    WhatsAppMessage.collection.createIndex({ lead: 1, timestamp: -1 }, { background: true }),
    WhatsAppMessage.collection.createIndex({ lead: 1, direction: 1, status: 1 }, { background: true }),
    Payment.collection.createIndex({ branchId: 1, status: 1, paidAt: -1 }, { background: true }),
    Notification.collection.createIndex({ user: 1, read: 1, createdAt: -1 }, { background: true }),
  ];

  try {
    await Promise.all(indexJobs);
    console.log('[MongoDB] Performance indexes ensured');
  } catch (err) {
    console.error('[MongoDB] Some indexes failed (API will still start):', err.message);
  }
}

module.exports = { ensureIndexes };
