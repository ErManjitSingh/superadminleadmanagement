const Lead = require('../models/Lead');
const { buildLeadListFilter, LEAD_LIST_POPULATE, enrichLead } = require('../utils/queryHelpers');
const { withBranch } = require('../utils/branchScope');

const KANBAN_STATUSES = [
  'new',
  'contacted',
  'working_progress',
  'follow_up',
  'quotation_sent',
  'negotiation',
  'reactivated',
  'converted',
];

const PER_COLUMN = 25;

async function getKanbanBoard(query = {}, { branchId, perColumn = PER_COLUMN } = {}) {
  const { status: _omit, ...rest } = query;
  const baseFilter = { ...buildLeadListFilter(rest), isDeleted: { $ne: true } };
  const match = withBranch(baseFilter, branchId);

  const countRows = await Lead.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(countRows.map((r) => [r._id, r.count]));
  const totalLeads = countRows.reduce((s, r) => s + r.count, 0);

  const columns = await Promise.all(
    KANBAN_STATUSES.map(async (status) => {
      const statusFilter = { ...match, status };
      const leads = await Lead.find(statusFilter)
        .select('-notes')
        .populate(LEAD_LIST_POPULATE)
        .sort({ createdAt: -1 })
        .limit(perColumn)
        .lean();
      return {
        status,
        total: countMap[status] || 0,
        leads: leads.map(enrichLead),
      };
    })
  );

  const data = columns.flatMap((col) => col.leads);

  return {
    columns,
    data,
    totalLeads,
    perColumn,
  };
}

module.exports = { getKanbanBoard, KANBAN_STATUSES, PER_COLUMN };
