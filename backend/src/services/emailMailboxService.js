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

function mapSentRow(row, leadMap) {
  const lead = leadMap.get(String(row.leadId));
  const toEmail = row.to?.[0] || '';
  return {
    id: String(row._id),
    type: 'sent',
    folder: row.status === 'failed' ? 'failed' : 'sent',
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
  return {
    id: String(row._id),
    type: 'inbound',
    folder: 'inbox',
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
  const leads = await Lead.find({ _id: { $in: unique } }).select('name destination email').lean();
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

  const [replies, sentRows, failedRows, sentTotal, failedTotal, inboxTotal] = await Promise.all([
    folder === 'inbox' || folder === 'all'
      ? EmailReply.find(replyFilter).sort({ receivedAt: -1 }).limit(500).lean()
      : [],
    folder === 'sent' || folder === 'all'
      ? EmailLog.find({ ...sentFilter, status: 'sent' }).sort({ sentAt: -1 }).limit(500).lean()
      : [],
    folder === 'failed' || folder === 'all'
      ? EmailLog.find({ ...sentFilter, status: 'failed' }).sort({ createdAt: -1 }).limit(500).lean()
      : [],
    EmailLog.countDocuments({ ...sentFilter, status: 'sent' }),
    EmailLog.countDocuments({ ...sentFilter, status: 'failed' }),
    EmailReply.countDocuments(replyFilter),
  ]);

  const leadIds = [
    ...replies.map((r) => r.leadId),
    ...sentRows.map((r) => r.leadId),
    ...failedRows.map((r) => r.leadId),
  ];
  const leadMap = await fetchLeadMap(leadIds);

  let items = [];
  if (folder === 'inbox') items = replies.map((r) => mapInboundRow(r, leadMap));
  else if (folder === 'sent') items = sentRows.map((r) => mapSentRow(r, leadMap));
  else if (folder === 'failed') items = failedRows.map((r) => mapSentRow(r, leadMap));
  else if (folder === 'all') {
    items = [
      ...replies.map((r) => mapInboundRow(r, leadMap)),
      ...sentRows.map((r) => mapSentRow(r, leadMap)),
      ...failedRows.map((r) => mapSentRow(r, leadMap)),
    ];
  }

  if (search.trim() && !searchRegex) {
    const q = search.trim().toLowerCase();
    items = items.filter((item) => matchesSearch(item, q));
  }

  items.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = items.length;
  const start = (Math.max(1, page) - 1) * limit;
  const paged = items.slice(start, start + limit);

  return {
    items: paged,
    total,
    page: Math.max(1, page),
    limit,
    counts: {
      inbox: inboxTotal,
      sent: sentTotal,
      failed: failedTotal,
      all: inboxTotal + sentTotal + failedTotal,
    },
    mailbox: CRM_MAIL,
  };
}

module.exports = { listMailboxMessages };
