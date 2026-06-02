import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(
      'cd /var/www/testing-unotrips-crm/backend && node src/scripts/clearLeads.js',
      (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
          conn.end();
          process.exit(code || 0);
        });
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stderr.write(d));
      }
    );
  })
  .on('error', (e) => {
    console.error(e);
    process.exit(1);
  })
  .connect({ host: '69.62.76.249', port: 22, username: 'root', password: PASSWORD });
