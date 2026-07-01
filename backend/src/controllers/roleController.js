const Role = require('../models/Role');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity, getClientIp } = require('../services/activityService');
const { withCompany } = require('../utils/branchScope');

const attachUserCount = async (role) => {
  const userCount = await User.countDocuments({ roleId: role._id, companyId: role.companyId });
  return { ...role.toObject?.() || role, userCount };
};

function companyRoleFilter(req) {
  return withCompany({}, req.companyId);
}

const listRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find(companyRoleFilter(req)).sort({ name: 1 });
  const result = await Promise.all(roles.map(attachUserCount));
  res.json(result);
});

const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, ...companyRoleFilter(req) });
  if (!role) throw new ApiError(404, 'Role not found');
  res.json(await attachUserCount(role));
});

const createRole = asyncHandler(async (req, res) => {
  const role = await Role.create({
    ...req.body,
    slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, '_'),
    isSystem: false,
    companyId: req.companyId,
  });

  await logActivity({
    type: 'user_action',
    user: req.user.name,
    userId: req.user._id,
    action: 'Created role',
    target: role.name,
    ip: getClientIp(req),
    branchId: req.branchId || req.user.branchId || null,
    companyId: req.companyId,
  });

  res.status(201).json(await attachUserCount(role));
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, ...companyRoleFilter(req) });
  if (!role) throw new ApiError(404, 'Role not found');

  if (role.isSystem) {
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Only admin can modify system roles');
    }
    if (req.body.permissions) {
      role.permissions = req.body.permissions;
      await role.save();
      return res.json(await attachUserCount(role));
    }
    const { name, slug, description, ...rest } = req.body;
    if (name || slug || description || Object.keys(rest).length) {
      throw new ApiError(403, 'System role name and metadata cannot be modified');
    }
    return res.json(await attachUserCount(role));
  }

  Object.assign(role, req.body);
  await role.save();
  res.json(await attachUserCount(role));
});

const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, ...companyRoleFilter(req) });
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.isSystem) throw new ApiError(403, 'System roles cannot be deleted');

  const inUse = await User.exists({ roleId: role._id, companyId: req.companyId });
  if (inUse) throw new ApiError(400, 'Role is assigned to users');

  await role.deleteOne();
  res.json({ message: 'Role deleted' });
});

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole };
