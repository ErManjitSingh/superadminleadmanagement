const mongoose = require('mongoose');

const companyIdField = {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company',
  index: true,
  default: null,
};

const QUERY_OPS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'findOneAndDelete',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'replaceOne',
  'count',
  'countDocuments',
  'distinct',
];

function getContextCompanyId() {
  try {
    const { getCompanyId } = require('../utils/tenantContextStore');
    const { normalizeCompanyId } = require('../utils/branchScope');
    return normalizeCompanyId(getCompanyId());
  } catch {
    return null;
  }
}

function applyTenantToQuery() {
  const opts = (this.getOptions && this.getOptions()) || this.options || {};
  if (opts.skipTenantFilter) return;

  const filter = this.getFilter ? this.getFilter() : this.getQuery();
  if (filter && Object.prototype.hasOwnProperty.call(filter, 'companyId')) return;

  const companyId = getContextCompanyId();
  if (!companyId) return;
  this.where({ companyId });
}

function tenantPlugin(schema) {
  if (!schema.path('companyId')) {
    schema.add({ companyId: companyIdField });
  }

  for (const op of QUERY_OPS) {
    schema.pre(op, applyTenantToQuery);
  }

  schema.pre('aggregate', function applyTenantToAggregate() {
    if (this.options?.skipTenantFilter) return;
    const companyId = getContextCompanyId();
    if (!companyId) return;
    const pipeline = this.pipeline();
    const first = pipeline[0];
    if (first?.$match && Object.prototype.hasOwnProperty.call(first.$match, 'companyId')) return;
    pipeline.unshift({ $match: { companyId } });
  });

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

    const ctxCompanyId = getContextCompanyId();
    if (ctxCompanyId) this.companyId = ctxCompanyId;
  });

  schema.pre('insertMany', async function assignCompanyOnBulk(next, docs) {
    if (!Array.isArray(docs)) return next();
    const ctxCompanyId = getContextCompanyId();
    const Branch = mongoose.model('Branch');
    const branchIds = [...new Set(docs.filter((d) => d.branchId && !d.companyId).map((d) => String(d.branchId)))];
    let map = {};
    if (branchIds.length) {
      const branches = await Branch.find({ _id: { $in: branchIds } }).select('companyId').lean();
      map = Object.fromEntries(branches.map((b) => [String(b._id), b.companyId]));
    }

    for (const doc of docs) {
      if (doc.companyId) continue;
      if (doc.branchId && map[String(doc.branchId)]) {
        doc.companyId = map[String(doc.branchId)];
        continue;
      }
      if (ctxCompanyId) doc.companyId = ctxCompanyId;
    }
    next();
  });
}

module.exports = { tenantPlugin, companyIdField };
