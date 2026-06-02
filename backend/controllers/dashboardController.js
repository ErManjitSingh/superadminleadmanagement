const Lead = require('../models/Lead');
const Followup = require('../models/Followup');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const wonLeads = await Lead.countDocuments({ status: 'won' });
    const lostLeads = await Lead.countDocuments({ status: 'lost' });
    const pendingFollowups = await Followup.countDocuments({ status: 'pending' });

    const leadsByStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const leadsBySource = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    const totalBudget = await Lead.aggregate([
      { $group: { _id: null, total: { $sum: '$budget' } } },
    ]);

    const recentLeads = await Lead.find()
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const upcomingFollowups = await Followup.find({
      status: 'pending',
      scheduledAt: { $gte: new Date() },
    })
      .populate('lead', 'name phone destination')
      .sort({ scheduledAt: 1 })
      .limit(5);

    res.json({
      totalLeads,
      newLeads,
      wonLeads,
      lostLeads,
      pendingFollowups,
      totalBudget: totalBudget[0]?.total || 0,
      leadsByStatus,
      leadsBySource,
      recentLeads,
      upcomingFollowups,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats };
