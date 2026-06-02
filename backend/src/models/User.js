const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    role: { type: String, enum: ROLES, required: true, index: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    department: { type: String, default: 'Sales' },
    status: { type: String, enum: ['active', 'disabled', 'invited'], default: 'active', index: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedLeads: { type: Number, default: 0 },
    skills: {
      type: [{ type: String, enum: ['fit', 'group', 'corporate'] }],
      default: [],
    },
    lastLogin: { type: Date },
    avatar: { type: String, default: null },
    inviteToken: String,
    inviteExpiresAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
