/**
 * E2E test: CRM login + AI itinerary generate on live IHD.
 */
import { Client } from 'ssh2';

const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) {
  console.error('Set VPS_PASSWORD');
  process.exit(1);
}

const conn = new Client();
conn.on('ready', () => {
  conn.exec(
    `
set -e
LOGIN=$(curl -sk -X POST https://indiaholidaydestination.com/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -H 'Origin: https://indiaholidaydestination.com' \\
  -d '{"email":"admin@crm.com","password":"123456"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))")
if [ -z "$TOKEN" ]; then echo "LOGIN_FAILED: $LOGIN"; exit 1; fi
echo "Login OK"
RESP=$(curl -sk -X POST https://indiaholidaydestination.com/api/ai-itinerary/generate \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $TOKEN" \\
  -H 'Origin: https://indiaholidaydestination.com' \\
  -d '{"prompt":"5 days Kerala honeymoon Kochi Munnar Alleppey backwater houseboat","days":5}')
echo "$RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('success:', d.get('success'))
print('source:', d.get('source'))
days = d.get('days') or []
print('days:', len(days))
if days:
    print('day1 title:', days[0].get('title','')[:80])
    print('day1 desc:', (days[0].get('description') or '')[:120])
if d.get('message'):
    print('message:', d.get('message')[:200])
"
`,
    (err, stream) => {
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', () => conn.end());
    },
  );
}).connect({
  host: process.env.VPS_HOST || '187.127.188.30',
  port: 22,
  username: 'root',
  password: PASSWORD,
});
