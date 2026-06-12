/**
 * Add Operations Manager demo user without full reseed.
 * Run: node src/scripts/seedOperationsUser.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectDB } = require('../config/db');
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Role = require('../models/Role');

const PASSWORD = process.env.SEED_PASSWORD || '123456';

async function run() {
  await connectDB();
  const branch = await Branch.findOne({ status: 'active' }).sort({ createdAt: 1 });
  if (!branch) throw new Error('No active branch found');

  const role = await Role.findOne({ slug: 'operations_manager' });
  const existing = await User.findOne({ email: 'ops@crm.com' });
  if (existing) {
    console.log('Operations user already exists: ops@crm.com');
  } else {
    await User.create({
      name: 'Operations Manager',
      email: 'ops@crm.com',
      password: PASSWORD,
      role: 'operations_manager',
      roleId: role?._id,
      department: 'Operations',
      branchId: branch._id,
    });
    console.log('Created ops@crm.com (password:', PASSWORD + ')');
  }
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
