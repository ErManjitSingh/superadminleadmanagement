const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['super_admin', 'platform_support'], default: 'super_admin' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
    lastLogin: { type: Date },
    avatar: { type: String, default: null },
    /** Optional Website Management ACL (module → actions). super_admin always has full access. */
    websitePermissions: { type: mongoose.Schema.Types.Mixed, default: null },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin' },
  },
  { timestamps: true, collection: 'super_admins' }
);

superAdminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

superAdminSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

superAdminSchema.query.notDeleted = function notDeleted() {
  return this.where({ deletedAt: null });
};

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
