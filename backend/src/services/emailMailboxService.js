const EmailLog = require('../models/EmailLog');
const EmailReply = require('../models/EmailReply');
const Lead = require('../models/Lead');
const { withBranch } = require('../utils/branchScope');
const { getExecutiveIdsForLeader } = require('./teamScopeService');

const CRM_MAIL = (process.env.SMTP_USER || 'sales@unotrips.com').toLowerCase();

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getExecutiveLeadIds(userId, branchId) {
  return Lead.find(withBranch({ assignedTo: userId }, branchId)).distinct('_id');
}

async function getLeaderScopeLeadIds(leaderId, branchId) {
  const execIds = await getExecutiveIdsForLeader(leaderId);
  return Lead.find(withBranch({ assignedTo: { $in: execIds } }, branchId)).distinct('_id');
}

async function resolveScopedLeadIds(req) {
  if (req.user.role === 'sales_executive') {
    return getExecutiveLeadIds(req.user._id, req.branchId);
  }
  if (req.user.role === 'team_leader') {
    return getLeaderScopeLeadIds(req.user._id, req.branchId);
  }
  return null;
}

function resolveExecutiveFromLead(lead) {
  const assignee = lead?.assignedTo;
  if (assignee && typeof assignee === 'object') {
    return {
      executiveId: assignee._id ? String(assignee._id) : null,
      executiveName: assignee.name || '',
    };
  }
  return {
    executiveId: assignee ? String(assignee) : null,
    executiveName: '',
  };
}

function mapSentRow(row, leadMap) {
  const lead = leadMap.get(String(row.leadId));
  const toEmail = row.to?.[0] || '';
  return {
    id: String(row._id),
    type: 'sent',
    folder: row.status === 'failed' ? 'failed' : 'sent',
    mailAction: 'sent',
    executiveId: row.sentBy ? String(row.sentBy) : null,
    executiveName: row.sentByName || '',
    from: { name: row.sentByName || 'UNO Trips', email: row.from || CRM_MAIL },
    to: row.to || [],
    subject: row.subject,
    snippet: row.status === 'failed'
      ? row.errorMessage || 'Delivery failed'
      : `Sent to ${toEmail}${row.attachmentNames?.length ? ` · ${row.attachmentNames.length} attachment(s)` : ''}`,
    date: row.sentAt || row.createdAt,
    isRead: true,
    starred: false,
    hasAttachment: (row.attachmentNames || []).length > 0,
    status: row.status,
    category: row.category,
    leadId: row.leadId,
    leadName: lead?.name || toEmail,
    leadDestination: lead?.destination || '',
  };
}

function mapInboundRow(row, leadMap) {
  const lead = leadMap.get(String(row.leadId));
  const executive = resolveExecutiveFromLead(lead);
  return {
    id: String(row._id),
    type: 'inbound',
    folder: 'inbox',
    mailAction: 'reply',
    executiveId: executive.executiveId,
    executiveName: executive.executiveName,
    from: { name: row.fromName || row.fromEmail, email: row.fromEmail },
    to: [CRM_MAIL],
    subject: row.subject || '(No subject)',
    snippet: row.snippet || '',
    date: row.receivedAt || row.createdAt,
    isRead: false,
    starred: false,
    hasAttachment: false,
    status: 'received',
    category: 'reply',
    leadId: row.leadId,
    leadName: lead?.name || row.fromName || row.fromEmail,
    leadDestination: lead?.destination || '',
    emailLogId: row.emailLogId,
  };
}

async function fetchLeadMap(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Map();
  const leads = await Lead.find({ _id: { $in: unique } })
    .select('name destination email assignedTo')
    .populate('assignedTo', 'name')
    .lean();
  return new Map(leads.map((l) => [String(l._id), l]));
}

function matchesSearch(item, q) {
  if (!q) return true;
  const hay = [
    item.subject,
    item.snippet,
    item.from?.name,
    item.from?.email,
    item.leadName,
    item.executiveName,
    ...(item.to || []),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

async function listMailboxMessages(req, { folder = 'inbox', search = '', page = 1, limit = 50 } = {}) {
  const branchFilter = withBranch({}, req.branchId);
  const scopedLeadIds = await resolveScopedLeadIds(req);
  const leadScope = scopedLeadIds ? { leadId: { $in: scopedLeadIds } } : {};
  const sentScope =
    req.user.role === 'sales_executive' ? { sentBy: req.user._id, ...branchFilter } : { ...branchFilter };

  const searchRegex = search.trim()
    ? new RegExp(escapeRegex(search.trim()), 'i')
    : null;

  const replyFilter = { ...branchFilter, ...leadScope };
  const sentFilter = { ...sentScope, ...leadScope };

  if (searchRegex) {
    replyFilter.$or = [
      { subject: searchRegex },
      { snippet: searchRegex },
      { fromEmail: searchRegex },
      { fromName: searchRegex },
    ];
    sentFilter.$or = [{ subject: searchRegex }, { sentByName: searchRegex }];
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [sentTotal, failedTotal, inboxTotal] = await Promise.all([
    EmailLog.countDocuments({ ...sentFilter, status: 'sent' }),
    EmailLog.countDocuments({ ...sentFilter, status: 'failed' }),
    EmailReply.countDocuments(replyFilter),
  ]);

  let replies = [];
  let sentRows = [];
  let failedRows = [];
  let total = 0;
  let items = [];

  if (folder === 'inbox') {
    [replies, total] = await Promise.all([
      EmailReply.find(replyFilter).sort({ receivedAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Promise.resolve(inboxTotal),
    ]);
    const leadMap = await fetchLeadMap(replies.map((r) => r.leadId));
    items = replies.map((r) => mapInboundRow(r, leadMap));
  } else if (folder === 'sent') {
    [sentRows, total] = await Promise.all([
      EmailLog.find({ ...sentFilter, status: 'sent' }).sort({ sentAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Promise.resolve(sentTotal),
    ]);
    const leadMap = await fetchLeadMap(sentRows.map((r) => r.leadId));
    items = sentRows.map((r) => mapSentRow(r, leadMap));
  } else if (folder === 'failed') {
    [failedRows, total] = await Promise.all([
      EmailLog.find({ ...sentFilter, status: 'failed' }).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Promise.resolve(failedTotal),
    ]);
    const leadMap = await fetchLeadMap(failedRows.map((r) => r.leadId));
    items = failedRows.map((r) => mapSentRow(r, leadMap));
  } else if (folder === 'all') {
    const prefetch = Math.min(safePage * safeLimit, 200);
    [replies, sentRows, failedRows] = await Promise.all([
      EmailReply.find(replyFilter).sort({ receivedAt: -1 }).limit(prefetch).lean(),
      EmailLog.find({ ...sentFilter, status: 'sent' }).sort({ sentAt: -1 }).limit(prefetch).lean(),
      EmailLog.find({ ...sentFilter, status: 'failed' }).sort({ createdAt: -1 }).limit(prefetch).lean(),
    ]);
    const leadMap = await fetchLeadMap([
      ...replies.map((r) => r.leadId),
      ...sentRows.map((r) => r.leadId),
      ...failedRows.map((r) => r.leadId),
    ]);
    items = [
      ...replies.map((r) => mapInboundRow(r, leadMap)),
      ...sentRows.map((r) => mapSentRow(r, leadMap)),
      ...failedRows.map((r) => mapSentRow(r, leadMap)),
    ];
    if (search.trim() && !searchRegex) {
      const q = search.trim().toLowerCase();
      items = items.filter((item) => matchesSearch(item, q));
    }
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    total = inboxTotal + sentTotal + failedTotal;
    items = items.slice(skip, skip + safeLimit);
  }

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    counts: {
      inbox: inboxTotal,
      sent: sentTotal,
      failed: failedTotal,
      all: inboxTotal + sentTotal + failedTotal,
    },
    mailbox: CRM_MAIL,
    showExecutive: ['team_leader', 'sales_manager', 'admin'].includes(req.user.role),
  };
}

async function assertMessageAccess(req, leadId) {
  const ApiError = require('../utils/apiError');
  if (!leadId) return;
  if (['admin', 'sales_manager'].includes(req.user.role)) return;

  const branchClause = req.branchId ? { branchId: req.branchId } : {};

  if (req.user.role === 'sales_executive') {
    const allowed = await Lead.exists({ _id: leadId, assignedTo: req.user._id, ...branchClause });
    if (!allowed) throw new ApiError(403, 'You do not have access to this message');
    return;
  }

  if (req.user.role === 'team_leader') {
    const execIds = await getExecutiveIdsForLeader(req.user._id);
    const allowed = await Lead.exists({
      _id: leadId,
      assignedTo: { $in: execIds },
      ...branchClause,
    });
    if (!allowed) throw new ApiError(403, 'You do not have access to this message');
  }
}

async function getMailboxMessage(req, { type, id }) {
  const ApiError = require('../utils/apiError');
  const branchFilter = withBranch({}, req.branchId);

  if (type === 'inbound') {
    const row = await EmailReply.findOne({ _id: id, ...branchFilter }).lean();
    if (!row) throw new ApiError(404, 'Message not found');
    await assertMessageAccess(req, row.leadId);

    const leadMap = await fetchLeadMap([row.leadId]);
    const item = mapInboundRow(row, leadMap);
    return {
      ...item,
      bodyText: row.bodyText || row.snippet || '',
      bodyHtml: row.bodyHtml || '',
      cc: [],
      bcc: [],
    };
  }

  if (type === 'sent') {
    const sentScope =
      req.user.role === 'sales_executive'
        ? { sentBy: req.user._id, ...branchFilter }
        : { ...branchFilter };

    const row = await EmailLog.findOne({
      _id: id,
      ...sentScope,
      status: { $in: ['sent', 'failed'] },
    }).lean();
    if (!row) throw new ApiError(404, 'Message not found');
    await assertMessageAccess(req, row.leadId);

    const leadMap = await fetchLeadMap([row.leadId]);
    const item = mapSentRow(row, leadMap);
    return {
      ...item,
      bodyText: row.bodyText || item.snippet || '',
      bodyHtml: '',
      cc: row.cc || [],
      bcc: row.bcc || [],
      errorMessage: row.errorMessage || '',
    };
  }

  throw new ApiError(400, 'Invalid message type');
}

module.exports = { listMailboxMessages, getMailboxMessage };
