import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD environment variable.');
  process.exit(1);
}

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d;
      });
      stream.stderr.on('data', (d) => {
        process.stderr.write(d);
        errOut += d;
      });
      stream.on('close', (code) => {
        if (code) return reject(new Error(errOut || out));
        resolve(out);
      });
    });
  });
}

const cmd = `set -e
cd /var/www
ts=$(date +%Y%m%d-%H%M%S)
if [ -d testing-unotrips-crm ]; then
  cp -a testing-unotrips-crm testing-unotrips-crm-backup-$ts
fi
cd /var/www/testing-unotrips-crm
git init -b main >/dev/null 2>&1 || true
git remote remove origin >/dev/null 2>&1 || true
git remote add origin https://github.com/ErManjitSingh/crmunotrips.git
git fetch origin main
git clean -fd
git reset --hard
git checkout -B main origin/main
git branch --set-upstream-to=origin/main main
echo '---'
git status -sb
echo '---'
ls -la
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    await exec(conn, cmd);
    conn.end();
  } catch (e) {
    console.error('Failed:', e.message);
    conn.end();
    process.exit(1);
  }
});
conn.on('error', (e) => {
  console.error('SSH error:', e.message);
  process.exit(1);
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
