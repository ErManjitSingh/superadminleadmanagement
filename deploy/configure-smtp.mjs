import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const HOST = process.env.VPS_HOST || '69.62.76.249';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const APP_ROOT = '/var/www/testing-unotrips-crm';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = process.env.SMTP_PORT || '465';
const SMTP_USER = process.env.SMTP_USER || 'sales@unotrips.com';
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'UNO Trips';

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}
if (!SMTP_PASS) {
  console.error('Set SMTP_PASS environment variable.');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}`));
        else resolve(out);
      });
    });
  });
}

// Escape for single-quoted shell strings
function shQuote(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

const script = `set -e
ENV_FILE=${APP_ROOT}/backend/.env
touch "$ENV_FILE"

upsert() {
  key="$1"
  val="$2"
  if grep -q "^\${key}=" "$ENV_FILE"; then
    sed -i "s|^\${key}=.*|\${key}=\${val}|" "$ENV_FILE"
  else
    echo "\${key}=\${val}" >> "$ENV_FILE"
  fi
}

upsert SMTP_HOST ${shQuote(SMTP_HOST)}
upsert SMTP_PORT ${shQuote(SMTP_PORT)}
upsert SMTP_USER ${shQuote(SMTP_USER)}
upsert SMTP_PASS ${shQuote(SMTP_PASS)}
upsert SMTP_FROM_NAME ${shQuote(SMTP_FROM_NAME)}

echo "==> SMTP vars set (password hidden)"
grep -E '^SMTP_(HOST|PORT|USER|FROM_NAME)=' "$ENV_FILE"

cd ${APP_ROOT}
pm2 restart deploy/ecosystem.config.cjs --update-env
pm2 save
sleep 2
curl -sf http://127.0.0.1:5000/api/health
echo ""
echo "CONFIGURE_SMTP_OK"
`;

const conn = new Client();
conn
  .on('ready', async () => {
    console.log('SSH connected.\n');
    try {
      await exec(conn, script);
    } finally {
      conn.end();
    }
  })
  .on('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD });
