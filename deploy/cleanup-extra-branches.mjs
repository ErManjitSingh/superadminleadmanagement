import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const script = `
cd /var/www/testing-unotrips-crm/backend
node <<'NODE'
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Branch = require('./src/models/Branch');

async function reassignBranchReferences(fromId, toId) {
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    if (name === 'branches') continue;
    const col = mongoose.connection.db.collection(name);

    if (name === 'branchassignmentsettings') {
      const targetExists = await col.findOne({ branchId: toId });
      if (targetExists) {
        const result = await col.deleteMany({ branchId: fromId });
        if (result.deletedCount) console.log('  ' + name + ': deleted ' + result.deletedCount);
      } else {
        const result = await col.updateMany({ branchId: fromId }, { $set: { branchId: toId } });
        if (result.modifiedCount) console.log('  ' + name + ': ' + result.modifiedCount);
      }
      continue;
    }

    const result = await col.updateMany({ branchId: fromId }, { $set: { branchId: toId } });
    if (result.modifiedCount) console.log('  ' + name + ': ' + result.modifiedCount);
  }
}

async function ensureAllowedBranches() {
  let shimla = await Branch.findOne({ code: 'SHIMLA' });
  if (!shimla) shimla = await Branch.create({ name: 'Shimla', code: 'SHIMLA', status: 'active' });

  let ptw = await Branch.findOne({ code: 'PTW' });
  const legacyPtw = await Branch.findOne({ code: 'BHATTAKUFER' });

  if (!ptw && legacyPtw) {
    legacyPtw.name = 'PTW';
    legacyPtw.code = 'PTW';
    ptw = await legacyPtw.save();
  } else if (!ptw) {
    ptw = await Branch.create({ name: 'PTW', code: 'PTW', status: 'active' });
  } else if (legacyPtw && String(legacyPtw._id) !== String(ptw._id)) {
    await reassignBranchReferences(legacyPtw._id, ptw._id);
    await Branch.deleteOne({ _id: legacyPtw._id });
  }

  return { shimla, ptw };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testing_unotrips_crm');
  const before = await Branch.find({}).sort({ name: 1 }).lean();
  console.log('Branches before:', before.map((b) => b.name + ' (' + b.code + ')').join(', '));

  const { shimla, ptw } = await ensureAllowedBranches();
  const keepIds = [shimla._id, ptw._id];
  const extras = await Branch.find({ _id: { $nin: keepIds } });

  for (const branch of extras) {
    const target = branch.code === 'BHATTAKUFER' ? ptw._id : shimla._id;
    console.log('Removing ' + branch.name + ' (' + branch.code + ')');
    await reassignBranchReferences(branch._id, target);
    await Branch.deleteOne({ _id: branch._id });
  }

  const after = await Branch.find({ status: 'active' }).sort({ name: 1 }).lean();
  console.log('Branches after:', after.map((b) => b.name + ' (' + b.code + ')').join(', '));
  console.log('CLEANUP_OK');
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
NODE
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(script, { pty: true }, (err, stream) => {
    if (err) {
      console.error(err.message);
      process.exit(1);
    }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
});
conn.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});
conn.connect({
  host: process.env.VPS_HOST || '69.62.76.249',
  port: Number(process.env.VPS_PORT || 22),
  username: process.env.VPS_USER || 'root',
  password: PASSWORD,
  readyTimeout: 30000,
});
