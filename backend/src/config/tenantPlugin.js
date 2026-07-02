const mongoose = require('mongoose');

const companyIdField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company',
  index: true,
  default: null,
};

function tenantPlugin(schema) {
  if (!schema.path('companyId')) {
    schema.add({ companyId: companyIdField });
  }

  schema.pre('save', async function assignCompanyFromBranch() {
    if (this.companyId) return;

    if (this.branchId) {
      const Branch = mongoose.model('Branch');
      const branch = await Branch.findById(this.branchId).select('companyId').lean();
      if (branch?.companyId) {
        this.companyId = branch.companyId;
        return;
      }
    }

    try {
      const { getCompanyId } = require('../utils/tenantContextStore');
      const { normalizeCompanyId } = require('../utils/branchScope');
      const ctxCompanyId = getCompanyId();
      if (ctxCompanyId) {
        this.companyId = normalizeCompanyId(ctxCompanyId);
      }
    } catch {
      // Outside request tenant context — companyId must be set explicitly.
    }
  });

  schema.pre('insertMany', async function assignCompanyOnBulk(next, docs) {
    if (!Array.isArray(docs)) return next();
    const Branch = mongoose.model('Branch');
    const branchIds = [...new Set(docs.filter((d) => d.branchId && !d.companyId).map((d) => String(d.branchId)))];
    if (!branchIds.length) return next();

    const branches = await Branch.find({ _id: { $in: branchIds } }).select('companyId').lean();
    const map = Object.fromEntries(branches.map((b) => [String(b._id), b.companyId]));

    for (const doc of docs) {
      if (!doc.companyId && doc.branchId && map[String(doc.branchId)]) {
        doc.companyId = map[String(doc.branchId)];
      }
    }
    next();
  });
}

module.exports = { tenantPlugin, companyIdField };
