/**
 * Test Gemini key on IHD VPS (reads key from server .env, does not print it).
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(errOut || out || `Exit ${code}`));
        else resolve(out);
      });
      stream.on('data', (d) => {
        out += d;
      });
      stream.stderr.on('data', (d) => {
        errOut += d;
      });
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash']) {
        const out = await exec(
          conn,
          `set -a
source /var/www/leadmanagement/backend/.env 2>/dev/null || true
set +a
RESP=$(curl -sS -w "\\nHTTP_CODE:%{http_code}" \\
  "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=\${GEMINI_API_KEY}" \\
  -H 'Content-Type: application/json' \\
  -d '{"contents":[{"parts":[{"text":"Reply with only the word OK"}]}]}')
CODE=$(echo "$RESP" | tail -1 | sed 's/HTTP_CODE://')
BODY=$(echo "$RESP" | sed '$d' | head -c 200)
echo "MODEL=${model} HTTP=$CODE"
echo "$BODY"`,
        );
        console.log(out);
      }
    } finally {
      conn.end();
    }
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
  });
