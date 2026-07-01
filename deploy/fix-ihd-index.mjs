import { Client } from 'ssh2';

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
mongosh indiaholidaydestination_crm --quiet --eval 'try { db.leads.dropIndex("alternatePhone_1"); print("dropped"); } catch (e) { print(e); }'
pm2 restart ihd-crm-api
sleep 4
curl -sf http://127.0.0.1:5000/api/health
echo ""
pm2 status
`;
  conn.exec(cmd, (err, stream) => {
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
      process.exit(code || 0);
    });
  });
}).connect({
  host: '187.127.188.30',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD,
});
