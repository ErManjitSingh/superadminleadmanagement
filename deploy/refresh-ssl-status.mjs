/**
 * Mark a company's SSL as active if the Let's Encrypt cert exists on disk.
 * Usage: $env:VPS_PASSWORD='...'; node deploy/refresh-ssl-status.mjs crm.exploremybharat.info
 */
import { Client } from 'ssh2';

const DOMAIN = process.argv[2] || 'crm.exploremybharat.info';
const PASSWORD = process.env.VPS_PASSWORD;
if (!PASSWORD) { console.error('Set VPS_PASSWORD'); process.exit(1); }

const remote = `
CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
if [ -f "$CERT" ]; then echo "CERT_EXISTS"; else echo "NO_CERT"; fi
cd /var/www/leadmanagement/backend && node -e '
const m=require("mongoose");
const e=require("./src/config/env");
const Company=require("./src/superadmin/models/Company");
m.connect(e.mongoUri).then(async()=>{
  const c=await Company.findOne({primaryDomain:"${DOMAIN}"});
  if(!c){console.log("NO_COMPANY");process.exit(0);}
  c.sslStatus="active";
  c.sslLastCheckedAt=new Date();
  if(!c.domainVerified){c.domainVerified=true;}
  await c.save();
  console.log("SSL_STATUS_NOW:"+c.sslStatus+" domainVerified:"+c.domainVerified);
  process.exit(0);
}).catch(err=>{console.error(err.message);process.exit(1);});
'
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(remote, (err, stream) => {
    if (err) { console.error(err.message); conn.end(); return; }
    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '187.127.188.30', username: 'root', password: PASSWORD });
