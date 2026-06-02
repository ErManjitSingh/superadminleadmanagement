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
  console.log(await exec(conn, 'ls /etc/nginx/sites-enabled/'));
  console.log(await exec(conn, 'grep -l unotrips /etc/nginx/sites-enabled/* 2>/dev/null'));
  for (const f of ['unotrips.com', 'www.unotrips.com', 'default']) {
    console.log(await exec(conn, `cat /etc/nginx/sites-enabled/*unotrips* 2>/dev/null | head -80`));
  }
  console.log(await exec(conn, 'find /var/www -name ".next" -type d 2>/dev/null'));
  conn.end();
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
