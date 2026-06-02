/**
 * One-shot VPS deploy via SSH/SFTP. Run locally:
 *   $env:VPS_PASSWORD='your-password'; node deploy/remote-deploy.mjs
 */
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APP_ROOT = '/var/www/testing-unotrips-crm';

const HOST = process.env.VPS_HOST || '69.62.76.249';
const USER = process.env.VPS_USER || 'root';
const PORT = Number(process.env.VPS_PORT || 22);
const PASSWORD = process.env.VPS_PASSWORD;

if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

const EXCLUDE = new Set([
  'node_modules',
  '.git',
  'frontend/dist',
  'logs',
  '.cursor',
  'agent-transcripts',
]);

function shouldInclude(rel) {
  const parts = rel.split(/[/\\]/);
  if (parts.some((p) => EXCLUDE.has(p))) return false;
  if (rel.endsWith('.log')) return false;
  return true;
}

function walk(dir, base = dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (!shouldInclude(rel)) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, base, files);
    else files.push({ local: full, remote: `${APP_ROOT}/${rel}` });
  }
  return files;
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}: ${errOut || out}`));
        else resolve(out);
      });
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => {
        process.stderr.write(d);
        errOut += d;
      });
    });
  });
}

function mkdirSftp(sftp, dir) {
  return new Promise((resolve, reject) => {
    sftp.mkdir(dir, (err) => {
      if (err && err.code !== 4) return reject(err);
      resolve();
    });
  });
}

async function uploadFiles(sftp, files) {
  const dirs = new Set();
  for (const f of files) {
    dirs.add(path.posix.dirname(f.remote));
  }
  for (const d of [...dirs].sort()) {
    const parts = d.split('/').filter(Boolean);
    let cur = '';
    for (const p of parts) {
      cur += `/${p}`;
      await mkdirSftp(sftp, cur);
    }
  }
  let n = 0;
  for (const f of files) {
    await new Promise((resolve, reject) => {
      sftp.fastPut(f.local, f.remote, (err) => (err ? reject(err) : resolve()));
    });
    n++;
    if (n % 100 === 0) console.log(`Uploaded ${n}/${files.length}...`);
  }
  console.log(`Uploaded ${files.length} files.`);
}

const conn = new Client();

conn
  .on('ready', async () => {
    console.log('SSH connected.\n');
    try {
      const sftp = await new Promise((resolve, reject) => {
        conn.sftp((err, s) => (err ? reject(err) : resolve(s)));
      });

      console.log('==> Ensuring app directory...');
      await exec(conn, `mkdir -p ${APP_ROOT}/logs`);

      const skipUpload = process.env.SKIP_UPLOAD === '1';
      if (!skipUpload) {
        console.log('==> Uploading project files...');
        const files = walk(ROOT);
        await uploadFiles(sftp, files);
      } else {
        console.log('==> Skipping upload (SKIP_UPLOAD=1)...');
      }

      const envBootstrap = `if [ ! -f ${APP_ROOT}/backend/.env ]; then
  cat > ${APP_ROOT}/backend/.env << 'ENVEOF'
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:27017/testing_unotrips_crm
JWT_SECRET=$(openssl rand -base64 48)
JWT_EXPIRES_IN=30d
CORS_ORIGINS=https://testing.unotrips.com
SEED_PASSWORD=123456
ENVEOF
fi
if [ ! -f ${APP_ROOT}/frontend/.env ]; then
  echo 'VITE_API_URL=https://testing.unotrips.com/api' > ${APP_ROOT}/frontend/.env
fi`;
      await exec(conn, envBootstrap);

      const script = `set -e
export DEBIAN_FRONTEND=noninteractive
command -v node >/dev/null || { curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs; }
command -v mongod >/dev/null || {
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  CODENAME=$(. /etc/os-release && echo $VERSION_CODENAME)
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu \${CODENAME}/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update && apt-get install -y mongodb-org
  systemctl enable mongod && systemctl start mongod
}
command -v nginx >/dev/null || apt-get install -y nginx
command -v pm2 >/dev/null || npm install -g pm2

systemctl start mongod 2>/dev/null || true

cd ${APP_ROOT}/backend
npm install --omit=dev
node -e "require('./src/config/env');const m=require('mongoose');const U=require('./src/models/User');m.connect(require('./src/config/env').mongoUri).then(async()=>{process.exit((await U.countDocuments())>0?0:1)}).catch(()=>process.exit(1))" && echo "DB already seeded" || npm run seed

cd ${APP_ROOT}/frontend
npm install
npm run build

cd ${APP_ROOT}
mkdir -p logs
pm2 delete testing-unotrips-api 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

if [ -f /etc/letsencrypt/live/testing.unotrips.com/fullchain.pem ]; then
  cp ${APP_ROOT}/deploy/nginx/testing.unotrips.com.conf /etc/nginx/sites-available/testing.unotrips.com
else
  cp ${APP_ROOT}/deploy/nginx/testing.unotrips.com.http-only.conf /etc/nginx/sites-available/testing.unotrips.com
fi
ln -sf /etc/nginx/sites-available/testing.unotrips.com /etc/nginx/sites-enabled/testing.unotrips.com
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

sleep 2
curl -sf http://127.0.0.1:5000/api/health || (pm2 logs testing-unotrips-api --lines 30 --nostream; exit 1)
echo ""
echo "DEPLOY_OK"
`;

      console.log('\n==> Running remote setup (may take several minutes)...\n');
      await exec(conn, script);
      console.log('\nDeploy finished. Test: http://testing.unotrips.com/api/health');
    } catch (e) {
      console.error('\nDeploy failed:', e.message);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error('SSH error:', e.message);
    process.exit(1);
  })
  .connect({ host: HOST, port: PORT, username: USER, password: PASSWORD, readyTimeout: 30000 });
