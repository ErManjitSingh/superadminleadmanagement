const map = {
  new: 'new',
  contacted: 'contacted',
  qualified: 'follow_up',
  follow_up: 'follow_up',
  proposal: 'quotation_sent',
  quotation_sent: 'quotation_sent',
  negotiation: 'negotiation',
  reactivated: 'reactivated',
  won: 'converted',
  converted: 'converted',
  lost: 'lost',
};

export function normalizeLeadStatus(status) {
  return map[status] || status;
}

/** Lead is closed — no further status changes in UI or API */
export const LOCKED_LEAD_STATUSES = ['converted', 'lost', 'booked_from_another_company'];

export function isLeadStatusLocked(status) {
  return LOCKED_LEAD_STATUSES.includes(normalizeLeadStatus(status));
}
