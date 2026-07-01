const crypto = require('crypto');
const PlatformSupportTicket = require('../models/PlatformSupportTicket');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { logPlatformAudit } = require('../services/platformAuditService');

async function nextTicketNumber() {
  const n = Date.now().toString(36).toUpperCase();
  return `PLT-${n}`;
}

function formatTicket(t) {
  return {
    id: t._id,
    ticketNumber: t.ticketNumber,
    companyId: t.companyId,
    companyName: t.companyName,
    contactEmail: t.contactEmail,
    subject: t.subject,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignedTo: t.assignedTo,
    replies: t.replies || [],
    internalNotes: t.internalNotes || [],
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    resolvedAt: t.resolvedAt,
  };
}

const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20 });
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [tickets, total] = await Promise.all([
    PlatformSupportTicket.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .lean(),
    PlatformSupportTicket.countDocuments(filter),
  ]);

  res.json(paginatedResponse(tickets.map(formatTicket), { page, limit, total }));
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await PlatformSupportTicket.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .lean();
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json({ ticket: formatTicket(ticket) });
});

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await PlatformSupportTicket.create({
    ticketNumber: await nextTicketNumber(),
    companyId: req.body.companyId,
    companyName: req.body.companyName,
    contactEmail: req.body.contactEmail,
    subject: req.body.subject,
    description: req.body.description || '',
    priority: req.body.priority || 'medium',
    status: 'open',
  });
  res.status(201).json({ ticket: formatTicket(ticket) });
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await PlatformSupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  if (req.body.status) {
    ticket.status = req.body.status;
    if (req.body.status === 'resolved') ticket.resolvedAt = new Date();
    if (req.body.status === 'closed') ticket.closedAt = new Date();
  }
  if (req.body.priority) ticket.priority = req.body.priority;
  if (req.body.assignedTo !== undefined) ticket.assignedTo = req.body.assignedTo || null;

  if (req.body.reply) {
    ticket.replies.push({
      authorType: 'superadmin',
      authorId: req.superAdmin._id,
      authorName: req.superAdmin.name,
      message: req.body.reply,
      isInternal: false,
    });
  }
  if (req.body.internalNote) {
    ticket.internalNotes.push({
      note: req.body.internalNote,
      authorId: req.superAdmin._id,
    });
  }

  await ticket.save();
  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'support_ticket_update',
    resourceType: 'platform_support_ticket',
    resourceId: ticket._id,
    companyId: ticket.companyId,
    req,
  });

  res.json({ ticket: formatTicket(ticket) });
});

module.exports = { listTickets, getTicket, createTicket, updateTicket };
