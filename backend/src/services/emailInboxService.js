const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const Lead = require('../models/Lead');
const EmailLog = require('../models/EmailLog');
const EmailReply = require('../models/EmailReply');
const { notifyUser } = require('./notificationService');

const POLL_MS = Number(process.env.EMAIL_INBOX_POLL_MS || 5 * 60 * 1000);
const CRM_MAILBOX = (process.env.SMTP_USER || 'sales@unotrips.com').toLowerCase();

let pollTimer = null;
let polling = false;

function isInboxConfigured() {
  const host = process.env.IMAP_HOST || process.env.SMTP_HOST;
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS;
  return !!(host && user && pass);
}

function extractEmailAddress(value) {
  const match = String(value || '').match(/<([^>]+)>/) || String(value || '').match(/([\w.+-]+@[\w.-]+\.\w+)/);
  return (match?.[1] || '').toLowerCase().trim();
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildSnippet(text, html) {
  const raw = (text || stripHtml(html) || '').trim();
  return raw.slice(0, 500);
}

function isReplySubject(subject) {
  return /^(re|fwd|fw)\s*:/i.test(String(subject || '').trim());
}

async function matchLeadAndLog(fromEmail, subject, inReplyTo, references) {
  const lead = await Lead.findOne({
    email: new RegExp(`^${fromEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    isDeleted: { $ne: true },
  })
    .select('_id assignedTo branchId name email')
    .lean();

  if (!lead) return { lead: null, emailLog: null };

  let emailLog = null;
  const refIds = String(references || inReplyTo || '')
    .split(/\s+/)
    .map((s) => s.replace(/[<>]/g, ''))
    .filter(Boolean);

  if (refIds.length) {
    emailLog = await EmailLog.findOne({ messageId: { $in: refIds } }).lean();
  }

  if (!emailLog && isReplySubject(subject)) {
    const baseSubject = String(subject).replace(/^(re|fwd|fw)\s*:\s*/i, '').trim();
    emailLog = await EmailLog.findOne({
      leadId: lead._id,
      subject: new RegExp(baseSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      status: 'sent',
    })
      .sort({ sentAt: -1 })
      .lean();
  }

  if (!emailLog) {
    emailLog = await EmailLog.findOne({ leadId: lead._id, status: 'sent' })
      .sort({ sentAt: -1 })
      .lean();
  }

  return { lead, emailLog };
}

async function processInboundMessage(parsed, messageId) {
  const fromEmail = extractEmailAddress(parsed.from?.text || parsed.from?.value?.[0]?.address);
  if (!fromEmail || fromEmail === CRM_MAILBOX) return null;

  const subject = parsed.subject || '';
  const snippet = buildSnippet(parsed.text, parsed.html);
  if (!snippet && !subject) return null;

  const { lead, emailLog } = await matchLeadAndLog(
    fromEmail,
    subject,
    parsed.inReplyTo,
    parsed.references
  );

  if (!lead) return null;

  const exists = await EmailReply.findOne({ messageId }).lean();
  if (exists) return null;

  const reply = await EmailReply.create({
    messageId,
    leadId: lead._id,
    emailLogId: emailLog?._id || null,
    branchId: lead.branchId || null,
    fromEmail,
    fromName: parsed.from?.value?.[0]?.name || lead.name || '',
    subject,
    snippet,
    receivedAt: parsed.date || new Date(),
  });

  if (lead.assignedTo) {
    await notifyUser(lead.assignedTo, {
      type: 'email_reply',
      title: 'Client replied to your email',
      message: `${lead.name || fromEmail}: ${snippet.slice(0, 120)}${snippet.length > 120 ? '…' : ''}`,
      branchId: lead.branchId,
      meta: { leadId: lead._id, emailReplyId: reply._id },
    });
    await EmailReply.findByIdAndUpdate(reply._id, { notifiedUser: lead.assignedTo });
  }

  return reply;
}

async function pollInboxOnce() {
  if (!isInboxConfigured() || polling) return;
  polling = true;

  const client = new ImapFlow({
    host: process.env.IMAP_HOST || process.env.SMTP_HOST,
    port: Number(process.env.IMAP_PORT || 993),
    secure: process.env.IMAP_SECURE !== 'false',
    auth: {
      user: process.env.IMAP_USER || process.env.SMTP_USER,
      pass: process.env.IMAP_PASS || process.env.SMTP_PASS,
    },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date();
      since.setDate(since.getDate() - 14);

      const uids = await client.search({ since }, { uid: true });
      if (uids.length) {
      for await (const msg of client.fetch(uids, { envelope: true, source: true, uid: true })) {
        const messageId = msg.envelope?.messageId;
        if (!messageId) continue;

        const known = await EmailReply.findOne({ messageId }).select('_id').lean();
        if (known) continue;

        const parsed = await simpleParser(msg.source);
        await processInboundMessage(parsed, messageId);
      }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    console.error('[EmailInbox] Poll failed:', err.message);
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
  } finally {
    polling = false;
  }
}

function startEmailInboxPoller() {
  if (!isInboxConfigured()) {
    console.log('[EmailInbox] IMAP not configured — reply tracking disabled');
    return;
  }
  if (pollTimer) return;
  console.log('[EmailInbox] Starting reply poller');
  pollInboxOnce().catch(() => {});
  pollTimer = setInterval(() => pollInboxOnce().catch(() => {}), POLL_MS);
}

module.exports = {
  isInboxConfigured,
  pollInboxOnce,
  startEmailInboxPoller,
};
