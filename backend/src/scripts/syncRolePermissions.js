/**
 * Sync system Role.permissions from backend/src/config/permissions.js
 * Safe to run on production — does not delete data.
 *
 * Usage (from backend/):
 *   node src/scripts/syncRolePermissions.js
 */
require('../config/env');
const mongoose = require('mongoose');
const env = require('../config/env');
const Role = require('../models/Role');
const { ROLE_PERMISSIONS } = require('../config/permissions');
const { ROLE_LABELS } = require('../config/roles');

async function sync() {
  await mongoose.connect(env.mongoUri);
  const slugs = Object.keys(ROLE_PERMISSIONS);
  let updated = 0;
  for (const slug of slugs) {
    const result = await Role.updateMany(
      { slug },
      {
        $set: {
          permissions: ROLE_PERMISSIONS[slug],
          name: ROLE_LABELS[slug] || slug,
        },
      },
    );
    updated += result.modifiedCount || 0;
    console.log(`${slug}: matched=${result.matchedCount} modified=${result.modifiedCount}`);
  }
  console.log(`Done. Modified ${updated} role document(s).`);
  await mongoose.disconnect();
}

sync().catch((err) => {
  console.error(err);
  process.exit(1);
});
