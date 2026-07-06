/**
 * Install Chromium system libs on VPS for Puppeteer PDF generation.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/fix-puppeteer-vps.mjs
 */
import { Client } from 'ssh2';

const HOST = process.env.VPS_HOST || '187.127.188.30';
const USER = process.env.VPS_USER || 'root';
const PASSWORD = process.env.VPS_PASSWORD;

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const INSTALL_CMD = `
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates fonts-liberation fonts-noto-color-emoji \
  libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 \
  libcairo2 libcups2t64 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0t64 libgtk-3-0t64 \
  libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6 \
  wget xdg-utils

ldconfig
CHROME=$(ls -d /root/.cache/puppeteer/chrome/*/chrome-linux64/chrome 2>/dev/null | head -1)
if [ -n "$CHROME" ]; then
  echo "==> Chrome missing libs:"
  ldd "$CHROME" | grep "not found" || echo "All Chrome libs resolved"
fi
pm2 restart ihd-crm-api 2>/dev/null || true
echo "PUPPETEER_FIX_OK"
`;

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}: ${out}`));
        else resolve(out);
      });
      stream.on('data', (d) => { process.stdout.write(d); out += d; });
      stream.stderr.on('data', (d) => { process.stderr.write(d); });
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      await exec(conn, INSTALL_CMD);
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: Number(process.env.VPS_PORT || 22), username: USER, password: PASSWORD });
