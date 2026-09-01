import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const KEY = '4bd8f5b83382a48286e1f006fbf7fa131098ba240e748acc';

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
      stream.on('close', (code) => resolve({ code, out }));
    });
  });
}

const conn = new Client();
conn
  .on('ready', async () => {
    try {
      console.log('==> ports');
      await exec(conn, 'sleep 5; ss -lntp | head -50');

      console.log('\n==> health');
      await exec(conn, 'curl -sS -m 10 http://127.0.0.1:5000/api/health || echo HEALTH_FAIL');

      const payload = JSON.stringify({
        name: 'VPS Test Lead',
        phone: '9876543210',
        destination: 'Manali',
        sourceLabel: 'Himachal Cab Website',
      });

      // write payload on server to avoid shell quoting hell
      await exec(
        conn,
        `printf '%s' '${payload.replace(/'/g, `'\\''`)}' > /tmp/lead-payload.json`
      );

      console.log('\n==> local POST');
      await exec(
        conn,
        `curl -sS -m 20 -w '\\nHTTP %{http_code}\\n' -X POST http://127.0.0.1:5000/api/public/leads -H 'Content-Type: application/json' -H 'X-Lead-Key: ${KEY}' --data-binary @/tmp/lead-payload.json || echo CURL_FAIL`
      );

      console.log('\n==> domain POST');
      await exec(
        conn,
        `curl -sS -m 25 -w '\\nHTTP %{http_code}\\n' -X POST https://crm.exploremybharat.info/api/public/leads -H 'Content-Type: application/json' -H 'X-Lead-Key: ${KEY}' --data-binary @/tmp/lead-payload.json || echo CURL_FAIL`
      );

      console.log('\n==> logs');
      await exec(conn, 'pm2 logs ihd-crm-api --lines 50 --nostream || true');
    } catch (e) {
      console.error(e.message || e);
      process.exitCode = 1;
    } finally {
      conn.end();
    }
  })
  .on('error', (e) => {
    console.error(e.message);
    process.exit(1);
  })
  .connect({ host: '187.127.188.30', port: 22, username: 'root', password: PASSWORD });
