const Lead = require('../models/Lead');

// @desc    Get all leads
// @route   GET /api/leads
const getLeads = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create lead
// @route   POST /api/leads
const createLead = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdBy: req.user._id,
      assignedTo: req.body.assignedTo || req.user._id,
    });

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    Object.assign(lead, req.body);
    await lead.save();

    const populated = await Lead.findById(lead._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await lead.deleteOne();
    res.json({ message: 'Lead removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Users available for lead assignment (admin)
// @route   GET /api/leads/assignees
const getLeadAssignees = async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ status: { $ne: 'disabled' } }).select('name email role');

    const salesManagers = users.filter((u) => u.role === 'sales_manager');
    const teamLeaders = users.filter((u) => u.role === 'team_leader');
    const salesExecutives = users.filter((u) => u.role === 'sales_executive');

    res.json({ salesManagers, teamLeaders, salesExecutives });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign leads to sales manager, team leader, or executive
// @route   POST /api/leads/assign
const assignLeads = async (req, res) => {
  try {
    const User = require('../models/User');
    const { leadIds, assigneeRole, assigneeId } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ message: 'No leads selected' });
    }

    const assignee = await User.findById(assigneeId).select('name email role');
    if (!assignee) {
      return res.status(404).json({ message: 'Assignee not found' });
    }

    if (assignee.role !== assigneeRole) {
      return res.status(400).json({ message: 'Role mismatch for selected user' });
    }

    await Lead.updateMany({ _id: { $in: leadIds } }, { assignedTo: assignee._id });

    const updated = await Lead.find({ _id: { $in: leadIds } })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Leads assigned',
      count: updated.length,
      assignee: assignee.name,
      role: assigneeRole,
      leads: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadAssignees,
  assignLeads,
};
