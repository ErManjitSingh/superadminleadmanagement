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
  for (const dir of ['/var/www/unotrips-meta', '/var/www/unotrips.com', '/var/www/unotrips-app']) {
    console.log(`\n=== ${dir} ===`);
    console.log(await exec(conn, `ls -la ${dir} 2>/dev/null | head -25`));
    console.log(await exec(conn, `test -d ${dir}/app && echo HAS_APP || echo NO_APP`));
    console.log(await exec(conn, `test -d ${dir}/src/app && echo HAS_SRC_APP || echo NO_SRC_APP`));
  }
  conn.end();
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
