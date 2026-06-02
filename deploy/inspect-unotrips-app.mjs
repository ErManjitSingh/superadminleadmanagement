import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.stderr.on('data', (d) => { out += d; });
      stream.on('close', (code) => (code ? reject(new Error(out || `exit ${code}`)) : resolve(out)));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    const pkg = await exec(conn, 'cat /var/www/unotrips-app/package.json');
    console.log('=== package.json ===\n', pkg);
    const lock = await exec(conn, 'head -80 /var/www/unotrips-app/package-lock.json 2>/dev/null || echo NO_LOCK');
    console.log('=== package-lock head ===\n', lock);
    const nodev = await exec(conn, 'node -v && cd /var/www/unotrips-app && ls -la .next 2>/dev/null | head -5');
    console.log('=== node & .next ===\n', nodev);
    conn.end();
  } catch (e) {
    console.error(e.message);
    conn.end();
    process.exit(1);
  }
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
