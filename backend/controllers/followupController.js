const Followup = require('../models/Followup');
const Lead = require('../models/Lead');

// @desc    Get all followups
// @route   GET /api/followups
const getFollowups = async (req, res) => {
  try {
    const { status, leadId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (leadId) filter.lead = leadId;

    const followups = await Followup.find(filter)
      .populate('lead', 'name phone destination status')
      .populate('createdBy', 'name email')
      .sort({ scheduledAt: 1 });

    res.json(followups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single followup
// @route   GET /api/followups/:id
const getFollowup = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id)
      .populate('lead', 'name phone destination status')
      .populate('createdBy', 'name email');

    if (!followup) {
      return res.status(404).json({ message: 'Followup not found' });
    }
    res.json(followup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create followup
// @route   POST /api/followups
const createFollowup = async (req, res) => {
  try {
    const lead = await Lead.findById(req.body.lead);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const followup = await Followup.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populated = await Followup.findById(followup._id)
      .populate('lead', 'name phone destination status')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update followup
// @route   PUT /api/followups/:id
const updateFollowup = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: 'Followup not found' });
    }

    if (req.body.status === 'completed' && !followup.completedAt) {
      req.body.completedAt = new Date();
    }

    Object.assign(followup, req.body);
    await followup.save();

    const populated = await Followup.findById(followup._id)
      .populate('lead', 'name phone destination status')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete followup
// @route   DELETE /api/followups/:id
const deleteFollowup = async (req, res) => {
  try {
    const followup = await Followup.findById(req.params.id);
    if (!followup) {
      return res.status(404).json({ message: 'Followup not found' });
    }

    await followup.deleteOne();
    res.json({ message: 'Followup removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getFollowups, getFollowup, createFollowup, updateFollowup, deleteFollowup };
