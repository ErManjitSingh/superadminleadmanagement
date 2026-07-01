/**
 * Backfill companyId on tenant-scoped collections from Branch/User.
 * Run: npm run migrate:company-id
 */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../superadmin/models/Company');

const BRANCH_SCOPED_MODELS = [
  'Lead', 'FollowUp', 'Quotation', 'Payment', 'Booking', 'Team', 'Attendance',
  'CallNote', 'Hotel', 'Cab', 'Flight', 'Vendor', 'Voucher', 'TripTask', 'TripDocument',
  'EmailLog', 'EmailReply', 'EmailTemplate', 'WhatsAppTemplate', 'Notification',
  'AuditLog', 'ActivityLog', 'LeadActivity', 'LeadAssignmentLog', 'LeadMergeLog',
  'LeadTransferLog', 'LeadEscalation', 'SupportTicket', 'MonthlySalesTarget',
  'UserDestination', 'BranchAssignmentSettings',
];

async function backfillFromBranch(Model, branchMap) {
  const name = Model.collection.collectionName;
  const cursor = Model.find({ companyId: null, branchId: { $ne: null } }).select('_id branchId').cursor();
  let updated = 0;
  for await (const doc of cursor) {
    const companyId = branchMap.get(String(doc.branchId));
    if (companyId) {
      await Model.updateOne({ _id: doc._id }, { $set: { companyId } });
      updated += 1;
    }
  }
  if (updated) console.log(`[migrate] ${name}: ${updated} documents`);
  return updated;
}

async function migrate() {
  await connectDB();
  console.log('[migrate] Connected');

  const legacy = await Company.findOne({ isLegacy: true });
  if (!legacy) {
    console.warn('[migrate] No legacy company found — run seed:platform first');
  }

  const branches = await Branch.find({}).select('_id companyId').lean();
  const branchMap = new Map(
    branches.filter((b) => b.companyId).map((b) => [String(b._id), b.companyId])
  );

  if (legacy) {
    await User.updateMany({ companyId: null }, { $set: { companyId: legacy._id } });
    await Branch.updateMany({ companyId: null }, { $set: { companyId: legacy._id } });
    await Role.updateMany({ companyId: null }, { $set: { companyId: legacy._id } });
    for (const b of branches) {
      if (!b.companyId) branchMap.set(String(b._id), legacy._id);
    }
    console.log('[migrate] Legacy company linked to users/branches/roles');
  }

  let total = 0;
  for (const modelName of BRANCH_SCOPED_MODELS) {
    const Model = require(`../models/${modelName}`);
    total += await backfillFromBranch(Model, branchMap);
  }

  const Lead = require('../models/Lead');
  const LeadNote = require('../models/LeadNote');
  const WhatsAppMessage = require('../models/WhatsAppMessage');
  const WhatsAppNote = require('../models/WhatsAppNote');

  const leads = await Lead.find({ companyId: { $ne: null } }).select('_id companyId').lean();
  const leadMap = new Map(leads.map((l) => [String(l._id), l.companyId]));

  for (const [Model, field] of [
    [LeadNote, 'lead'],
    [WhatsAppMessage, 'lead'],
    [WhatsAppNote, 'lead'],
  ]) {
    let count = 0;
    const rows = await Model.find({ companyId: null }).select(`_id ${field}`).lean();
    for (const row of rows) {
      const companyId = leadMap.get(String(row[field]));
      if (companyId) {
        await Model.updateOne({ _id: row._id }, { $set: { companyId } });
        count += 1;
      }
    }
    if (count) console.log(`[migrate] ${Model.modelName}: ${count} via lead`);
    total += count;
  }

  console.log(`[migrate] Done. Total updates: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
