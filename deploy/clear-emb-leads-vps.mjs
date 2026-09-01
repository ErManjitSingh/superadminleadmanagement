import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const COMPANY_ID = '6a4d15fc8523f18259eed5e7'; // Explore My Bharat

function exec(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => {
        process.stdout.write(d);
        out += d.toString();
      });
      stream.stderr.on('data', (d) => {
        process.stderr.write(d);
        out += d.toString();
      });
      stream.on('close', (code) => {
        if (code !== 0) reject(new Error(`Exit ${code}\n${out}`));
        else resolve(out);
      });
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      console.log('Clearing ALL leads for Explore My Bharat...\n');
      await exec(
        conn,
        `cd /var/www/leadmanagement/backend && node src/scripts/clearLeads.js ${COMPANY_ID}`
      );
      console.log('\nDone.');
    } catch (e) {
      console.error(e.message || e);
      process.exit(1);
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error(e.message);
    process.exit(1);
  })
  .connect({ host: '187.127.188.30', port: 22, username: 'root', password: PASSWORD });
