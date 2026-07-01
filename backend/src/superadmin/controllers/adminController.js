const SuperAdmin = require('../models/SuperAdmin');
const ApiError = require('../../utils/apiError');
const asyncHandler = require('../../utils/asyncHandler');
const { logPlatformAudit } = require('../services/platformAuditService');

function formatAdmin(a) {
  return {
    id: a._id,
    name: a.name,
    email: a.email,
    role: a.role,
    status: a.status,
    lastLogin: a.lastLogin,
    avatar: a.avatar,
    createdAt: a.createdAt,
  };
}

const PLATFORM_ROLES = [
  { slug: 'super_admin', name: 'Super Admin', description: 'Full platform access' },
  { slug: 'platform_support', name: 'Platform Support', description: 'Companies, tickets, read-only billing' },
];

const listAdmins = asyncHandler(async (req, res) => {
  const admins = await SuperAdmin.find({ deletedAt: null })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ data: admins.map(formatAdmin), roles: PLATFORM_ROLES });
});

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password required');

  const exists = await SuperAdmin.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already registered');

  const admin = await SuperAdmin.create({
    name,
    email,
    password,
    role: role || 'platform_support',
    createdBy: req.superAdmin._id,
  });

  await logPlatformAudit({
    actor: req.superAdmin,
    action: 'admin_create',
    resourceType: 'super_admin',
    resourceId: admin._id,
    req,
  });

  res.status(201).json({ admin: formatAdmin(admin) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const admin = await SuperAdmin.findById(req.superAdmin._id);
  if (!admin) throw new ApiError(404, 'Not found');

  if (req.body.name) admin.name = req.body.name;
  if (req.body.avatar !== undefined) admin.avatar = req.body.avatar;
  if (req.body.password) admin.password = req.body.password;
  await admin.save();

  res.json({ admin: formatAdmin(admin) });
});

module.exports = { listAdmins, createAdmin, updateProfile, PLATFORM_ROLES };
