import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
const cmd = [
  'which java 2>/dev/null || echo NO_JAVA',
  'test -d /opt/android-sdk && echo ANDROID_SDK_OK || echo NO_ANDROID_SDK',
  'test -d ~/Android/Sdk && echo USER_ANDROID_SDK || true',
  'node -v 2>/dev/null || echo NO_NODE',
  'npm -v 2>/dev/null || echo NO_NPM',
].join('; ');

if (!PASSWORD) {
  console.error('Need VPS_PASSWORD');
  process.exit(1);
}

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', () => conn.end());
    });
  })
  .connect({
    host: process.env.VPS_HOST || '187.127.188.30',
    port: 22,
    username: 'root',
    password: PASSWORD,
    readyTimeout: 60000,
  });
