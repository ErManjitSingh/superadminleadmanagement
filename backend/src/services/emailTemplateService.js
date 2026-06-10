const EmailTemplate = require('../models/EmailTemplate');

const DEFAULT_TEMPLATES = [
  {
    name: 'Quotation',
    category: 'quotation',
    subject: 'Your travel quotation — {{destination}} | UNO Trips',
    body:
      'Dear {{customerName}},\n\nThank you for your interest in travelling to {{destination}}.\n\nPlease find your quotation {{quotationNumber}} attached. Total amount: {{amount}}.\n\nTravel date: {{travelDate}}.\n\nWe look forward to hearing from you.\n\nWarm regards,\nUNO Trips Sales Team',
    sortOrder: 1,
  },
  {
    name: 'Follow-up',
    category: 'follow_up',
    subject: 'Following up on your trip to {{destination}}',
    body:
      'Dear {{customerName}},\n\nJust following up regarding your travel inquiry for {{destination}}.\n\nPlease let us know if you have any questions or would like to proceed.\n\nBest regards,\nUNO Trips',
    sortOrder: 2,
  },
  {
    name: 'Booking Confirmation',
    category: 'booking_confirmation',
    subject: 'Booking confirmed — {{destination}} | UNO Trips',
    body:
      'Dear {{customerName}},\n\nYour booking for {{destination}} is confirmed.\n\nTravel date: {{travelDate}}.\n\nThank you for choosing UNO Trips!',
    sortOrder: 3,
  },
  {
    name: 'Payment Confirmation',
    category: 'payment_confirmation',
    subject: 'Payment received — {{amount}} | UNO Trips',
    body:
      'Dear {{customerName}},\n\nWe have received your payment of {{amount}}.\n\nThank you for your trust in UNO Trips.',
    sortOrder: 4,
  },
  {
    name: 'Welcome',
    category: 'welcome',
    subject: 'Welcome to UNO Trips, {{customerName}}!',
    body:
      'Dear {{customerName}},\n\nWelcome to UNO Trips!\n\nWe are delighted to assist you with your travel plans to {{destination}}.\n\nOur team will be in touch shortly.',
    sortOrder: 5,
  },
  {
    name: 'Reactivation',
    category: 'reactivation',
    subject: 'Still planning your trip to {{destination}}?',
    body:
      'Dear {{customerName}},\n\nWe noticed you were interested in a trip to {{destination}}.\n\nWe would love to help you plan again. Reply to this email or call us anytime.\n\nUNO Trips Sales Team',
    sortOrder: 6,
  },
];

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `₹${n.toLocaleString('en-IN')}`;
}

function formatTravelDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function renderEmailTemplate(text, context = {}) {
  const vars = {
    customerName: context.customerName || context.name || 'Customer',
    destination: context.destination || 'your destination',
    quotationNumber: context.quotationNumber || context.quoteNumber || '',
    amount: context.amount != null ? formatCurrency(context.amount) : '',
    travelDate: formatTravelDate(context.travelDate),
    executiveName: context.executiveName || 'UNO Trips',
  };

  return String(text || '').replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

async function ensureDefaultEmailTemplates(branchId, userId) {
  const filter = branchId ? { branchId } : { branchId: null };
  const count = await EmailTemplate.countDocuments(filter);
  if (count > 0) return;

  await EmailTemplate.insertMany(
    DEFAULT_TEMPLATES.map((t) => ({
      ...t,
      enabled: true,
      branchId: branchId || null,
      createdBy: userId || null,
    }))
  );
}

module.exports = {
  DEFAULT_TEMPLATES,
  renderEmailTemplate,
  ensureDefaultEmailTemplates,
};
