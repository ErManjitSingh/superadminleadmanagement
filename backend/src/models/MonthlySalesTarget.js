const mongoose = require('mongoose');

const monthlySalesTargetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    revenueTarget: { type: Number, required: true, min: 0 },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    setByName: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

monthlySalesTargetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
monthlySalesTargetSchema.index({ branchId: 1, year: 1, month: 1 });

module.exports = mongoose.model('MonthlySalesTarget', monthlySalesTargetSchema);
