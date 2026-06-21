/**
 * Keep only SHIMLA and PTW branches; reassign data and delete the rest.
 * Run: node src/scripts/cleanupExtraBranches.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Branch = require('../models/Branch');

async function reassignBranchReferences(fromId, toId) {
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    if (name === 'branches') continue;
    const col = mongoose.connection.db.collection(name);

    if (name === 'branchassignmentsettings') {
      const targetExists = await col.findOne({ branchId: toId });
      if (targetExists) {
        const result = await col.deleteMany({ branchId: fromId });
        if (result.deletedCount) console.log(`  ${name}: deleted ${result.deletedCount}`);
      } else {
        const result = await col.updateMany({ branchId: fromId }, { $set: { branchId: toId } });
        if (result.modifiedCount) console.log(`  ${name}: ${result.modifiedCount}`);
      }
      continue;
    }

    const result = await col.updateMany({ branchId: fromId }, { $set: { branchId: toId } });
    if (result.modifiedCount) console.log(`  ${name}: ${result.modifiedCount}`);
  }
}

async function ensureAllowedBranches() {
  let shimla = await Branch.findOne({ code: 'SHIMLA' });
  if (!shimla) {
    shimla = await Branch.create({ name: 'Shimla', code: 'SHIMLA', status: 'active' });
    console.log('Created branch: Shimla (SHIMLA)');
  }

  let ptw = await Branch.findOne({ code: 'PTW' });
  const legacyPtw = await Branch.findOne({ code: 'BHATTAKUFER' });

  if (!ptw && legacyPtw) {
    legacyPtw.name = 'PTW';
    legacyPtw.code = 'PTW';
    ptw = await legacyPtw.save();
    console.log('Renamed Bhattakufer → PTW');
  } else if (!ptw) {
    ptw = await Branch.create({ name: 'PTW', code: 'PTW', status: 'active' });
    console.log('Created branch: PTW');
  } else if (legacyPtw && String(legacyPtw._id) !== String(ptw._id)) {
    await reassignBranchReferences(legacyPtw._id, ptw._id);
    await Branch.deleteOne({ _id: legacyPtw._id });
    console.log('Merged duplicate Bhattakufer into PTW');
  }

  return { shimla, ptw };
}

async function run() {
  await connectDB();

  const before = await Branch.find({}).sort({ name: 1 }).lean();
  console.log('Branches before:', before.map((b) => `${b.name} (${b.code})`).join(', ') || '(none)');

  const { shimla, ptw } = await ensureAllowedBranches();
  const keepIds = [shimla._id, ptw._id];

  const extras = await Branch.find({ _id: { $nin: keepIds } });
  for (const branch of extras) {
    const target = branch.code === 'BHATTAKUFER' ? ptw._id : shimla._id;
    console.log(`Removing ${branch.name} (${branch.code}) → reassign to ${String(target) === String(ptw._id) ? 'PTW' : 'Shimla'}`);
    await reassignBranchReferences(branch._id, target);
    await Branch.deleteOne({ _id: branch._id });
  }

  const after = await Branch.find({ status: 'active' }).sort({ name: 1 }).lean();
  console.log('\nBranches after:', after.map((b) => `${b.name} (${b.code})`).join(', '));
  console.log('CLEANUP_OK');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
