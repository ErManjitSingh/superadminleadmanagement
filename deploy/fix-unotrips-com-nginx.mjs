import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PASSWORD = process.env.VPS_PASSWORD;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code ? reject(new Error(`exit ${code}`)) : resolve()));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  const sftp = await new Promise((res, rej) => conn.sftp((e, s) => (e ? rej(e) : res(s))));
  const local = path.join(ROOT, 'deploy/nginx/unotrips.com.conf');
  await new Promise((res, rej) =>
    sftp.fastPut(local, '/etc/nginx/sites-available/unotrips.com', (e) => (e ? rej(e) : res()))
  );

  await exec(conn, `set -e
ln -sf /etc/nginx/sites-available/unotrips.com /etc/nginx/sites-enabled/unotrips.com
nginx -t
systemctl reload nginx
sleep 1
curl -skI https://unotrips.com/ | head -12
curl -sk -o /dev/null -w "Homepage body: %{http_code}\\n" https://unotrips.com/
echo "UNOTRIPS_COM_OK"
`);
  conn.end();
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
