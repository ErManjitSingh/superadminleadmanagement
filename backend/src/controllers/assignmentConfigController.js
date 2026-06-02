const asyncHandler = require('../utils/asyncHandler');
const { LEAD_AUTO_ASSIGNMENT_ENABLED } = require('../config/assignment');

const getAssignmentStatus = asyncHandler(async (req, res) => {
  res.json({
    leadAutoAssignmentEnabled: LEAD_AUTO_ASSIGNMENT_ENABLED,
    manualAssignmentEnabled: true,
  });
});

module.exports = { getAssignmentStatus };
