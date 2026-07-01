import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -n "server_name\\|listen 443\\|root " /etc/nginx/sites-enabled/indiaholidaydestination.com', (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.188.30',
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
