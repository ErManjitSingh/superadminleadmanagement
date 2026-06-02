import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const APP = '/var/www/testing-unotrips-crm';

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { process.stdout.write(d); out += d; });
      stream.stderr.on('data', (d) => { process.stderr.write(d); out += d; });
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve(out)));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    await exec(conn, `echo "=== PM2 LIST ===" && pm2 list`);
    await exec(conn, `echo "=== PM2 DESCRIBE unotrips ===" && pm2 describe unotrips 2>/dev/null | head -40 || echo "no unotrips"`);
    await exec(conn, `echo "=== API ERRORS (last 40) ===" && tail -40 ${APP}/logs/api-error.log 2>/dev/null || true`);
    await exec(conn, `echo "=== UNOTRIPS PM2 LOGS ===" && pm2 logs unotrips --lines 30 --nostream 2>/dev/null || true`);
    await exec(conn, `echo "=== FIND NEXT APPS ===" && find /var/www -maxdepth 3 -name "next.config.*" 2>/dev/null | head -20`);
    conn.end();
  } catch (e) {
    console.error(e.message);
    conn.end();
    process.exit(1);
  }
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
