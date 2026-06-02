import { Client } from 'ssh2';
const PASSWORD = process.env.VPS_PASSWORD;
function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d; });
      stream.stderr.on('data', (d) => { out += d; });
      stream.on('close', (code) => resolve({ code, out }));
    });
  });
}
const conn = new Client();
conn.on('ready', async () => {
  const cmds = [
    'pm2 list',
    'curl -sI http://127.0.0.1:3000/ 2>/dev/null | head -8 || echo "port 3000 down"',
    'curl -skI https://unotrips.com/ 2>/dev/null | head -15 || echo "curl https failed"',
    'grep -n "proxy_pass\\|root\\|listen" /etc/nginx/sites-enabled/unotrips.com | head -40',
    'wc -l /etc/nginx/sites-enabled/unotrips.com',
    'tail -80 /etc/nginx/sites-enabled/unotrips.com',
  ];
  for (const c of cmds) {
    console.log('\n===', c, '===\n');
    const { code, out } = await exec(conn, c);
    console.log(out);
    if (code) console.log('(exit', code + ')');
  }
  conn.end();
});
conn.connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
