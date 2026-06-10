const Lead = require('../models/Lead');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const WhatsAppNote = require('../models/WhatsAppNote');
const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { LEAD_LIST_POPULATE, enrichLead, buildLeadSearchFilter, FOLLOWUP_POPULATE } = require('../utils/queryHelpers');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const listConversations = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 25, maxLimit: 100 });
  const filter = { channel: 'whatsapp' };
  if (req.branchId) filter.branchId = req.branchId;
  if (status) filter.status = status;
  Object.assign(filter, buildLeadSearchFilter(search));

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .select('-notes')
      .populate(LEAD_LIST_POPULATE)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);
  const leadIds = leads.map((l) => l._id);

  const [lastMessages, unreadCounts] = await Promise.all([
    WhatsAppMessage.aggregate([
      { $match: { lead: { $in: leadIds } } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$lead', lastMessage: { $first: '$$ROOT' } } },
    ]),
    WhatsAppMessage.aggregate([
      {
        $match: {
          lead: { $in: leadIds },
          direction: 'incoming',
          status: { $ne: 'read' },
        },
      },
      { $group: { _id: '$lead', count: { $sum: 1 } } },
    ]),
  ]);

  const lastMap = Object.fromEntries(lastMessages.map((m) => [m._id.toString(), m.lastMessage]));
  const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u._id.toString(), u.count]));

  const conversations = leads.map((lead) => {
    const enriched = enrichLead(lead);
    const id = lead._id.toString();
    const last = lastMap[id];
    return {
      _id: `wa-conv-${id}`,
      leadId: lead._id,
      lead: enriched,
      lastMessage: last
        ? {
            _id: last._id,
            text: last.text,
            direction: last.direction,
            type: last.type,
            status: last.status,
            timestamp: last.timestamp,
          }
        : null,
      unreadCount: unreadMap[id] || 0,
    };
  });

  res.json(paginatedResponse(conversations, { page, limit, total }));
});

const getMessages = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.leadId, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .select('_id');
  if (!lead) throw new ApiError(404, 'Lead not found');

  const messages = await WhatsAppMessage.find({ lead: lead._id })
    .sort({ timestamp: 1 })
    .lean();
  res.json(messages);
});

const getNotes = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.leadId, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .select('_id');
  if (!lead) throw new ApiError(404, 'Lead not found');

  const notes = await WhatsAppNote.find({ lead: lead._id })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean();
  res.json(notes);
});

const getFollowUpsForLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.leadId, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .select('_id');
  if (!lead) throw new ApiError(404, 'Lead not found');

  const followups = await FollowUp.find({ lead: lead._id, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .populate(FOLLOWUP_POPULATE)
    .sort({ scheduledAt: -1 })
    .lean();
  res.json(followups);
});

const listExecutives = asyncHandler(async (req, res) => {
  const executives = await User.find({
    role: 'sales_executive',
    status: 'active',
    ...(req.branchId ? { branchId: req.branchId } : {}),
  })
    .select('name email')
    .lean();
  res.json(executives);
});

const postMessage = asyncHandler(async (req, res) => {
  const { leadId, text, type = 'text', attachment } = req.body;
  if (!leadId) throw new ApiError(400, 'leadId is required');

  const lead = await Lead.findOne({ _id: leadId, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');

  const msg = await WhatsAppMessage.create({
    lead: leadId,
    direction: 'outgoing',
    type,
    text: text || '',
    attachment: attachment || null,
    status: 'sent',
    timestamp: new Date(),
    sentBy: req.user._id,
  });

  res.status(201).json(msg);
});

const postNote = asyncHandler(async (req, res) => {
  const { leadId, text } = req.body;
  if (!leadId || !text?.trim()) throw new ApiError(400, 'leadId and text are required');

  const lead = await Lead.findOne({ _id: leadId, ...(req.branchId ? { branchId: req.branchId } : {}) });
  if (!lead) throw new ApiError(404, 'Lead not found');

  const note = await WhatsAppNote.create({
    lead: leadId,
    text: text.trim(),
    user: req.user._id,
  });

  const populated = await WhatsAppNote.findById(note._id).populate('user', 'name email').lean();
  res.status(201).json(populated);
});

const updateWhatsAppLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, ...(req.branchId ? { branchId: req.branchId } : {}) },
    req.body,
    { new: true, runValidators: true }
  )
    .populate(LEAD_POPULATE)
    .lean();
  if (!lead) throw new ApiError(404, 'Lead not found');
  res.json(enrichLead(lead));
});

const markRead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.leadId, ...(req.branchId ? { branchId: req.branchId } : {}) })
    .select('_id');
  if (!lead) throw new ApiError(404, 'Lead not found');

  await WhatsAppMessage.updateMany(
    { lead: lead._id, direction: 'incoming' },
    { status: 'read' }
  );
  res.json({ success: true });
});

module.exports = {
  listConversations,
  getMessages,
  getNotes,
  getFollowUpsForLead,
  listExecutives,
  postMessage,
  postNote,
  updateWhatsAppLead,
  markRead,
};
