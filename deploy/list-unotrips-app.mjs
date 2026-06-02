import { Client } from 'ssh2';
const PASSWORD = process.env.VPS_PASSWORD;
function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.on('close', (code) => (code ? reject(new Error(out)) : resolve(out)));
    });
  });
}
const conn = new Client();
conn.on('ready', async () => {
  console.log(await exec(conn, 'ls -la /var/www/unotrips-app && echo --- && ls -la /var/www/ && echo --- && find /var/www -maxdepth 2 -name app -type d 2>/dev/null'));
  conn.end();
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
