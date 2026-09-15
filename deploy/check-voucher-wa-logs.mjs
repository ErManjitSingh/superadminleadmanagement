/**
 * Quick VPS check for advance voucher WhatsApp / receipt issues.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/check-voucher-wa-logs.mjs
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const cmd = [
  'set +e',
  'echo "==> Recent API logs (receipt/whatsapp)"',
  'pm2 logs ihd-crm-api --lines 200 --nostream 2>&1 | grep -iE "PaymentWhatsApp|ReceiptPDF|whatsapp|no_pdf|puppeteer|LeadActivity|PayloadTooLarge|resend|MongoError" | tail -40',
  'echo',
  'echo "==> Receipt uploads"',
  'ls -lt /var/www/leadmanagement/backend/uploads/receipts 2>/dev/null | head -12 || echo NO_RECEIPTS_DIR',
  'echo',
  'echo "==> Disk"',
  'df -h /var/www/leadmanagement | tail -1',
].join('\n');

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(cmd, (err, stream) => {
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
  .connect({
    host: process.env.VPS_HOST || '187.127.188.30',
    port: 22,
    username: 'root',
    password: PASSWORD,
    readyTimeout: 60000,
  });
