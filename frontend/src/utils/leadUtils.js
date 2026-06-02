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
