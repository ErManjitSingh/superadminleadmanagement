const mongoose = require('mongoose');
const { tenantPlugin } = require('../config/tenantPlugin');

const permissionBlock = {
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  approve: { type: Boolean, default: false },
  export: { type: Boolean, default: false },
};

const roleSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true, default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: false },
    userCount: { type: Number, default: 0 },
    permissions: {
      users: permissionBlock,
      leads: permissionBlock,
      customers: permissionBlock,
      quotations: permissionBlock,
      reports: permissionBlock,
      packages: permissionBlock,
      payments: permissionBlock,
      operations: permissionBlock,
      whatsapp: {
        use: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },
      email: {
        send: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

roleSchema.index({ companyId: 1, slug: 1 }, { unique: true });

roleSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Role', roleSchema);
