import { Client } from 'ssh2';
const PASSWORD = process.env.VPS_PASSWORD;
function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.on('close', () => resolve(out));
    });
  });
}
const conn = new Client();
conn.on('ready', async () => {
  console.log(await exec(conn, `find /var/www/unotrips.com/public_html -maxdepth 3 \\( -name package.json -o -name 'app' -type d \\) 2>/dev/null | head -20`));
  console.log(await exec(conn, `ls -la /var/www/unotrips.com/public_html | head -20`));
  console.log(await exec(conn, `pm2 describe unotrips 2>/dev/null | grep -E 'exec cwd|script path'`));
  conn.end();
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
