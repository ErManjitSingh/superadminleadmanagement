const Lead = require('../models/Lead');
const Quotation = require('../models/Quotation');
const Booking = require('../models/Booking');
const BookingPayment = require('../models/BookingPayment');
const { QUOTATION_POPULATE, buildLeadSearchFilter } = require('../utils/queryHelpers');
const { parsePagination, parseSort, paginatedResponse } = require('../utils/pagination');
const { withBranch } = require('../utils/branchScope');

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function intersectLeadIds(existing, next) {
  if (!existing?.$in?.length) return { $in: next };
  const allowed = new Set(next.map(String));
  const merged = existing.$in.filter((id) => allowed.has(String(id)));
  return { $in: merged };
}

function leadIdOf(row) {
  const lead = row?.lead;
  if (!lead) return null;
  if (typeof lead === 'object') return lead._id || null;
  return lead;
}

/**
 * Attach advance voucher / booking summary onto quotation rows (by lead).
 */
async function enrichQuotationsWithAdvanceVouchers(rows = []) {
  if (!rows.length) return rows;

  const leadIds = [...new Set(rows.map(leadIdOf).filter(Boolean).map(String))];
  if (!leadIds.length) {
    return rows.map((row) => ({
      ...row,
      advanceVoucher: { exists: false, sent: false },
    }));
  }

  const bookings = await Booking.find({ lead: { $in: leadIds } })
    .select('_id lead firstAdvancePaymentId advanceReceived totalAmount remainingBalance status bookingNumber')
    .sort({ createdAt: -1 })
    .lean();

  const bookingByLead = new Map();
  for (const b of bookings) {
    const key = String(b.lead);
    if (!bookingByLead.has(key)) bookingByLead.set(key, b);
  }

  const paymentIds = [...bookingByLead.values()]
    .map((b) => b.firstAdvancePaymentId)
    .filter(Boolean);

  const payments = await BookingPayment.find({
    $or: [
      ...(paymentIds.length ? [{ _id: { $in: paymentIds } }] : []),
      { lead: { $in: leadIds }, isFirstAdvance: true },
    ],
  })
    .select(
      '_id lead booking amount receiptNumber whatsappSentAt emailSentAt receiptPdfUrl isFirstAdvance paymentDate mode'
    )
    .sort({ createdAt: -1 })
    .lean();

  const paymentById = new Map(payments.map((p) => [String(p._id), p]));
  const paymentByLead = new Map();
  for (const p of payments) {
    const key = String(p.lead);
    if (!paymentByLead.has(key)) paymentByLead.set(key, p);
  }

  return rows.map((row) => {
    const lid = leadIdOf(row);
    const key = lid ? String(lid) : '';
    const booking = key ? bookingByLead.get(key) : null;
    let payment = null;
    if (booking?.firstAdvancePaymentId) {
      payment = paymentById.get(String(booking.firstAdvancePaymentId)) || null;
    }
    if (!payment && key) payment = paymentByLead.get(key) || null;

    const sent = !!(payment?.whatsappSentAt || payment?.emailSentAt);
    return {
      ...row,
      advanceVoucher: {
        exists: !!(booking || payment),
        sent,
        amount: payment?.amount ?? booking?.advanceReceived ?? 0,
        receiptNumber: payment?.receiptNumber || '',
        whatsappSentAt: payment?.whatsappSentAt || null,
        emailSentAt: payment?.emailSentAt || null,
        paymentDate: payment?.paymentDate || null,
        mode: payment?.mode || '',
        bookingId: booking?._id || payment?.booking || null,
        paymentId: payment?._id || null,
        bookingNumber: booking?.bookingNumber || '',
        bookingStatus: booking?.status || '',
        remainingBalance: booking?.remainingBalance ?? null,
      },
    };
  });
}

function wantsAdvanceEnrichment(query = {}) {
  return (
    query.includeAdvanceVoucher === true ||
    query.includeAdvanceVoucher === 'true' ||
    query.includeAdvanceVoucher === '1' ||
    query.sentOnly === true ||
    query.sentOnly === 'true' ||
    query.sentOnly === '1'
  );
}

async function applyQuotationQueryFilters(filter, query = {}, branchId) {
  const { status, executiveId, dateFrom, dateTo, destination, search, lead, leadId, sentOnly } = query;

  const wantsSentOnly = sentOnly === true || sentOnly === 'true' || sentOnly === '1';
  if (wantsSentOnly) {
    filter.sentAt = { $exists: true, $ne: null };
  } else if (status && filter.status === undefined) {
    filter.status = status;
  }
  if (executiveId) filter.createdByExecutive = executiveId;

  const scopedLeadId = leadId || lead;
  if (scopedLeadId) filter.lead = scopedLeadId;

  if (dateFrom || dateTo) {
    const dateField = wantsSentOnly ? 'sentAt' : 'createdAt';
    if (wantsSentOnly) {
      filter.sentAt = { $exists: true, $ne: null };
    } else {
      filter.createdAt = {};
    }
    const range = filter[dateField];
    if (dateFrom) range.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  const destinationTrim = destination?.trim();
  const searchTrim = search?.trim();

  if (destinationTrim) {
    const leadQuery = {
      destination: new RegExp(`^${escapeRegex(destinationTrim)}$`, 'i'),
    };
    const leadIds = await Lead.find(withBranch(leadQuery, branchId)).distinct('_id');
    filter.lead = filter.lead?.$in
      ? intersectLeadIds(filter.lead, leadIds)
      : { $in: leadIds };
  }

  if (searchTrim) {
    const or = [{ quoteNumber: { $regex: searchTrim, $options: 'i' } }];
    if (Number.isFinite(Number(searchTrim))) {
      or.push({ 'pricing.total': Number(searchTrim) });
    }

    const searchLeadIds = await Lead.find(withBranch(buildLeadSearchFilter(searchTrim), branchId))
      .select('_id')
      .limit(200)
      .lean();
    if (searchLeadIds.length) {
      or.push({ lead: { $in: searchLeadIds.map((l) => l._id) } });
    }

    filter.$or = or;
  }

  return filter;
}

async function findQuotationsPaginated(query = {}, { branchId } = {}) {
  const { page, limit, skip } = parsePagination(query);
  const wantsSentOnly = query.sentOnly === true || query.sentOnly === 'true' || query.sentOnly === '1';
  const sort = parseSort(query, wantsSentOnly ? { sentAt: -1 } : { createdAt: -1 });
  const filter = await applyQuotationQueryFilters(withBranch({}, branchId), query, branchId);

  const [rows, total] = await Promise.all([
    Quotation.find(filter).populate(QUOTATION_POPULATE).sort(sort).skip(skip).limit(limit).lean(),
    Quotation.countDocuments(filter),
  ]);

  const data = wantsAdvanceEnrichment(query) ? await enrichQuotationsWithAdvanceVouchers(rows) : rows;
  return paginatedResponse(data, { page, limit, total });
}

module.exports = {
  applyQuotationQueryFilters,
  findQuotationsPaginated,
  enrichQuotationsWithAdvanceVouchers,
  wantsAdvanceEnrichment,
};
