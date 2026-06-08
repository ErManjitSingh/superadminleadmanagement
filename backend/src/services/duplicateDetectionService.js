const Lead = require('../models/Lead');
const { LEAD_POPULATE, enrichLead } = require('../utils/queryHelpers');

function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '').slice(-10);
}

async function findDuplicateLeads({ phone, alternatePhone, email, branchId, excludeId }) {
  const phones = [phone, alternatePhone]
    .filter(Boolean)
    .map(normalizePhone)
    .filter((p) => p.length >= 10);

  const or = [];
  for (const p of phones) {
    const tail = p.slice(-10);
    or.push({ phone: { $regex: tail } });
    or.push({ alternatePhone: { $regex: tail } });
  }
  if (email?.trim()) {
    or.push({ email: { $regex: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  }
  if (!or.length) return [];

  const filter = { $or: or, isDeleted: { $ne: true } };
  if (branchId) filter.branchId = branchId;
  if (excludeId) filter._id = { $ne: excludeId };

  const rows = await Lead.find(filter)
    .populate(LEAD_POPULATE)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return rows.map(enrichLead);
}

module.exports = { normalizePhone, findDuplicateLeads };
