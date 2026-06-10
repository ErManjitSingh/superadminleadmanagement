const Lead = require('../models/Lead');
const { LEAD_POPULATE, enrichLead } = require('../utils/queryHelpers');

function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '').slice(-10);
}

/** Duplicate = same 10-digit phone (primary or alternate). Email is not used. */
async function findDuplicateLeads({ phone, alternatePhone, branchId, excludeId }) {
  const phones = [...new Set([phone, alternatePhone]
    .filter(Boolean)
    .map(normalizePhone)
    .filter((p) => p.length === 10))];

  if (!phones.length) return [];

  const or = [];
  for (const tail of phones) {
    or.push({ phone: { $regex: `${tail}$` } });
    or.push({ alternatePhone: { $regex: `${tail}$` } });
  }

  const filter = { $or: or, isDeleted: { $ne: true } };
  if (branchId) filter.branchId = branchId;
  if (excludeId) filter._id = { $ne: excludeId };

  const rows = await Lead.find(filter)
    .populate(LEAD_POPULATE)
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return rows.map(enrichLead);
}

module.exports = { normalizePhone, findDuplicateLeads };
