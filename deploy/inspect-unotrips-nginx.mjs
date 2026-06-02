import { Client } from 'ssh2';
const PASSWORD = process.env.VPS_PASSWORD;
function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.stderr.on('data', (d) => { out += d; });
      stream.on('close', (code) => (code ? reject(new Error(out)) : resolve(out)));
    });
  });
}
const conn = new Client();
conn.on('ready', async () => {
  try {
    console.log(await exec(conn, 'grep -r "3000\\|unotrips-app" /etc/nginx/sites-enabled/ 2>/dev/null | head -30'));
    console.log(await exec(conn, 'cd /var/www/unotrips-app && npm ls next react react-dom 2>/dev/null'));
    conn.end();
  } catch (e) { console.error(e.message); conn.end(); process.exit(1); }
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
