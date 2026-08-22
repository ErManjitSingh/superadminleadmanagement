import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const remoteCmd = `
set -e
cd /var/www/leadmanagement
echo '=== HEAD ==='
git rev-parse --short HEAD
git log -1 --oneline
echo
echo '=== Live invoice gen code ==='
grep -n 'invoiceCount\\|countDocuments\\|nextPaymentInvoiceNumber\\|INV-' backend/src/services/bookingPaymentService.js | head -40 || true
echo
echo '=== helper file? ==='
ls -la backend/src/utils/nextPaymentInvoiceNumber.js 2>&1 || echo MISSING_HELPER
echo
echo '=== Recent duplicate key errors ==='
pm2 logs ihd-crm-api --lines 300 --nostream 2>&1 | grep -E 'E11000|invoiceNumber|duplicate key' | tail -40 || echo 'no matches'
echo
echo '=== Mongo invoice stats ==='
mongosh indiaholidaydestination_crm --quiet --eval '
const year = new Date().getFullYear();
const prefix = "INV-" + year + "-";
const docs = db.payments.find({ invoiceNumber: { $regex: "^" + prefix } }, { invoiceNumber: 1 }).toArray();
let max = 0;
for (const d of docs) {
  const m = String(d.invoiceNumber || "").match(new RegExp("^" + prefix + "(\\\\d+)$"));
  if (m) max = Math.max(max, parseInt(m[1], 10));
}
const countBased = prefix + String(docs.length + 1).padStart(4, "0");
const countBasedExists = !!db.payments.findOne({ invoiceNumber: countBased });
printjson({
  year,
  paymentDocsWithInvPrefix: docs.length,
  maxSeq: max,
  nextSafe: prefix + String(max + 1).padStart(4, "0"),
  countBasedNext: countBased,
  countBasedWouldCollide: countBasedExists,
  inv0024Exists: !!db.payments.findOne({ invoiceNumber: "INV-2026-0024" }),
});
'
echo
curl -sf http://127.0.0.1:5000/api/health; echo
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
    console.error(e.message);
    process.exit(1);
  })
  .connect({
    host: process.env.VPS_HOST || '187.127.188.30',
    port: Number(process.env.VPS_PORT || 22),
    username: process.env.VPS_USER || 'root',
    password: PASSWORD,
    readyTimeout: 60000,
  });
