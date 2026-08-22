/**
 * Move workspace subdomain `crm` to India Holiday Destinations.
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/leadmanagement';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const remoteCmd = `
set -euo pipefail
URI=$(grep '^MONGO_URI=' ${APP}/backend/.env | cut -d= -f2- | tr -d '\\r')
mongosh "$URI" --quiet --eval '
const allCrm = db.companies.find({ subdomain: "crm" }, { name: 1, subdomain: 1, deletedAt: 1, ownerEmail: 1, slug: 1, status: 1 }).toArray();
print("HOLDERS_OF_CRM");
allCrm.forEach((c) => print([c._id, c.name, c.slug, c.ownerEmail, c.status, c.deletedAt || "active"].join(" | ")));

const ihd = db.companies.findOne({
  deletedAt: null,
  $or: [
    { name: /india holiday/i },
    { ownerEmail: /indiaholidaydestination/i },
    { slug: /india-holiday/i }
  ]
});
print("IHD=" + (ihd ? [ihd._id, ihd.name, ihd.subdomain, ihd.ownerEmail].join(" | ") : "missing"));

if (!ihd) {
  print("ABORT_NO_IHD");
} else if (ihd.subdomain === "crm") {
  print("IHD_ALREADY_CRM");
} else {
  allCrm.forEach((c) => {
    if (String(c._id) === String(ihd._id)) return;
    const next = (c.slug || "old") + "-old-crm";
    db.companies.updateOne({ _id: c._id }, { $set: { subdomain: next, updatedAt: new Date() } });
    print("RENAMED " + c.name + " crm -> " + next);
  });
  db.companies.updateOne({ _id: ihd._id }, { $set: { subdomain: "crm", updatedAt: new Date() } });
  print("SET IHD subdomain=crm");
}

const verify = db.companies.findOne({ subdomain: "crm" }, { name: 1, subdomain: 1, ownerEmail: 1, deletedAt: 1 });
print("VERIFY=" + [verify && verify.name, verify && verify.subdomain, verify && verify.ownerEmail, verify && (verify.deletedAt || "active")].join(" | "));
'
echo ASSIGN_IHD_CRM_OK
`;

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(remoteCmd, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        conn.end();
        process.exit(code || 0);
      });
    });
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, username: 'root', password: PASSWORD, readyTimeout: 60000 });
