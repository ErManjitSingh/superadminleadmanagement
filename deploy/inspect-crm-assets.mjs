/**
 * Inspect CRM asset paths vs nginx on VPS.
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const cmd = `
set -e
WEB=/var/www/indiaholidaydestination.com/public_html
echo "=== /app/index.html script/link tags ==="
grep -E 'src=|href=' $WEB/app/index.html || true
echo
echo "=== asset file exists? ==="
ls $WEB/app/assets/charts-*.js 2>/dev/null || echo "no charts chunk in /app/assets"
ls $WEB/assets/charts-*.js 2>/dev/null || echo "no charts chunk in /assets (root)"
echo
echo "=== curl crm /assets/charts ==="
FILE=$(ls $WEB/app/assets/charts-*.js | head -1 | xargs -n1 basename)
echo "chunk=$FILE"
curl -sk -o /dev/null -w "crm_/assets/: %{http_code} %{content_type}\\n" -H "Host: crm.indiaholidaydestination.com" "https://127.0.0.1/assets/$FILE"
curl -sk -o /dev/null -w "crm_/app/assets/: %{http_code} %{content_type}\\n" -H "Host: crm.indiaholidaydestination.com" "https://127.0.0.1/app/assets/$FILE"
curl -sk -o /dev/null -w "apex_/app/assets/: %{http_code} %{content_type}\\n" -H "Host: indiaholidaydestination.com" "https://127.0.0.1/app/assets/$FILE"
echo
echo "=== frontend .env ==="
cat /var/www/leadmanagement/frontend/.env 2>/dev/null || echo "no .env"
echo INSPECT_OK
`;

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
  .connect({ host: HOST, username: 'root', password: PASSWORD, readyTimeout: 60000 });
